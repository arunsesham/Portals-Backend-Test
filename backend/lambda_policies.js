
import pool from './db.js';

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Constants
const BUCKET_NAME = process.env.AWS_S3_BUCKET_PORTAL || "portals-dev";
const REGION = process.env.AWS_REGION_PORTAL || "us-east-1";

// Initialize S3 Client
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_PORTAL,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PORTAL
    }
});


const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
});

// Helpers
export const generateUploadUrl = async (bucket, key, contentType) => {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const generateDownloadUrl = async (bucket, key) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const path = event.path || event.requestContext?.domainName || ''; // standard path
    const id = event.pathParameters?.id;
    const tenantId = '79c00000-0000-0000-0000-000000000001'; // Static for now per your logic

    // Routing flags
    const isVersionsPath = path.includes('/versions');
    const isStatusPath = path.includes('/status');

    let client;
    try {
        client = await pool.connect();

        // --- GET /policies: List Policies ---
        if (method === 'GET' && !id) {
            const role = event.queryStringParameters?.role;

            let query = `
                SELECT p.*, pv.version_number, pv.status as version_status, pv.updated_at as version_date
                FROM policies p
                LEFT JOIN policy_versions pv ON p.current_version_id::text = pv.version_id::text
                WHERE p.tenant_id = $1 AND p.is_active = TRUE
            `;

            if (role !== 'admin') {
                query += ` AND p.current_version_id IS NOT NULL`;
            }
            query += ` ORDER BY p.created_at DESC`;

            const res = await client.query(query, [tenantId]);
            return createResponse(200, res.rows);
        }

        // --- GET /policies/{id}: Get Single Policy ---
        if (method === 'GET' && id && !isVersionsPath) {
            const res = await client.query(
                `SELECT p.*, pv.s3_key, pv.s3_bucket, pv.version_number
                  FROM policies p
                  LEFT JOIN policy_versions pv ON p.current_version_id::text = pv.version_id::text
                  WHERE p.policy_id = $1 AND p.tenant_id = $2`,
                [id, tenantId]
            );

            if (res.rowCount === 0) return createResponse(404, { message: "Policy not found" });

            const policy = res.rows[0];
            if (policy.s3_bucket && policy.s3_key) {
                policy.document_url = await generateDownloadUrl(policy.s3_bucket, policy.s3_key);
            }

            return createResponse(200, policy);
        }

        // --- PUT /policies/{id}: Update Policy Details / Status ---
        if (method === 'PUT' && id) {
            const { policy_name, description, is_active, policy_type, updated_at, created_by } = JSON.parse(event.body || '{}');

            // Build dynamic query
            const updates = [];
            const values = [id, tenantId, updated_at];
            let idx = 4;

            if (policy_name !== undefined) {
                updates.push(`policy_name = $${idx++}`);
                values.push(policy_name);
            }
            if (description !== undefined) {
                updates.push(`description = $${idx++}`);
                values.push(description);
            }
            if (policy_type !== undefined) {
                updates.push(`policy_type = $${idx++}`);
                values.push(policy_type);
            }
            if (is_active !== undefined) {
                updates.push(`is_active = $${idx++}`);
                values.push(is_active);
            }
            if (created_by !== undefined) {
                updates.push(`created_by = $${idx++}`);
                values.push(created_by);
            }

            if (updates.length > 0) {
                await client.query(
                    `UPDATE policies SET ${updates.join(', ')}, updated_at = $3 WHERE policy_id = $1 AND tenant_id = $2`,
                    values
                );
            }

            return createResponse(200, { message: "Policy updated successfully" });
        }

        // --- POST /policies: Create Policy + v1 Draft ---
        if (method === 'POST' && !id) {
            const { policy_id, policy_name, policy_type, description, created_by, filename, version_id } = JSON.parse(event.body || '{}');
            const versionNumber = 1;
            const s3Key = `policies/${tenantId}/${policy_id}/v${versionNumber}/${filename}`;

            await client.query('BEGIN');
            try {
                await client.query(
                    `INSERT INTO policies (policy_id, policy_name, policy_type, description, tenant_id, created_by, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
                    [policy_id, policy_name, policy_type, description, tenantId, created_by]
                );

                await client.query(
                    `INSERT INTO policy_versions (version_id, policy_id, version_number, s3_bucket, s3_key, created_by, status)
                     VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT')`,
                    [version_id, policy_id, versionNumber, BUCKET_NAME, s3Key, created_by]
                );

                const uploadUrl = await generateUploadUrl(BUCKET_NAME, s3Key, 'application/pdf');

                await client.query('COMMIT');
                return createResponse(201, {
                    policy_id,
                    version_id,
                    upload_url: uploadUrl,
                    message: "Policy created. Upload document to 'upload_url'."
                });
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        }

        // --- POST /policies/{id}/versions: Create New Version ---
        if (method === 'POST' && id && isVersionsPath && !isStatusPath) {
            const { created_by, change_summary, filename, version_id } = JSON.parse(event.body || '{}');

            const lastVer = await client.query(
                `SELECT MAX(version_number) as max_ver FROM policy_versions WHERE policy_id = $1`,
                [id]
            );

            const nextVersion = (lastVer.rows[0].max_ver || 0) + 1;
            const s3Key = `policies/${tenantId}/${id}/v${nextVersion}/${filename}`;

            await client.query(
                `INSERT INTO policy_versions (version_id, policy_id, version_number, s3_bucket, s3_key, created_by, change_summary, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')`,
                [version_id, id, nextVersion, BUCKET_NAME, s3Key, created_by, change_summary]
            );

            const uploadUrl = await generateUploadUrl(BUCKET_NAME, s3Key, 'application/pdf');

            return createResponse(201, {
                version_id,
                version_number: nextVersion,
                upload_url: uploadUrl
            });
        }

        // --- PATCH /policies/{id}/versions/{vId}/status: Approve ---
        if (method === 'PATCH' && id && isStatusPath) {
            let { status, version_id, updated_at } = JSON.parse(event.body || '{}');
            if (!version_id && event.pathParameters?.versionId) {
                version_id = event.pathParameters.versionId;
            }

            if (status === 'APPROVED') {
                await client.query('BEGIN');
                try {
                    // Archive old
                    await client.query(
                        `UPDATE policy_versions SET status = 'ARCHIVED' 
                         WHERE policy_id = $1 AND status = 'APPROVED'`,
                        [id]
                    );

                    // Approve new
                    await client.query(
                        `UPDATE policy_versions SET status = 'APPROVED' WHERE version_id = $1`,
                        [version_id]
                    );

                    // Update main pointer
                    await client.query(
                        `UPDATE policies SET current_version_id = $1, updated_at = $3 WHERE policy_id = $2`,
                        [version_id, id, updated_at]
                    );

                    await client.query('COMMIT');
                    return createResponse(200, { message: "Version approved and live." });
                } catch (e) {
                    await client.query('ROLLBACK');
                    throw e;
                }
            }
        }

        // --- GET /policies/{id}/versions/{versionId}: Get Specific Version (Preview) ---
        if (method === 'GET' && id && isVersionsPath && event.pathParameters?.versionId && !isStatusPath) {
            const versionId = event.pathParameters.versionId;
            const res = await client.query(
                `SELECT pv.*, p.policy_name, p.policy_type 
                 FROM policy_versions pv 
                 JOIN policies p ON pv.policy_id = p.policy_id
                 WHERE pv.policy_id = $1 AND pv.version_id = $2`,
                [id, versionId]
            );

            if (res.rowCount === 0) return createResponse(404, { message: "Version not found" });

            const version = res.rows[0];
            if (version.s3_bucket && version.s3_key) {
                version.document_url = await generateDownloadUrl(version.s3_bucket, version.s3_key);
            }

            return createResponse(200, version);
        }

        // --- GET /policies/{id}/versions: List History ---
        if (method === 'GET' && id && isVersionsPath) {
            const res = await client.query(
                `SELECT * FROM policy_versions WHERE policy_id = $1 ORDER BY version_number DESC`,
                [id]
            );
            return createResponse(200, res.rows);
        }

        return createResponse(404, { message: "Route not found" });

    } catch (err) {
        console.error(err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};