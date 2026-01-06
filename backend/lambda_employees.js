
import pool from './db.js';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS Configuration
let s3Client;
const getS3Client = () => {
    if (!s3Client) {
        s3Client = new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    }
    return s3Client;
};
const BUCKET_NAME = process.env.AWS_S3_BUCKET || "portals-dev";

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    const path = event.path || event.requestContext?.path; // e.g., /employees/123/avatar/upload-url
    const empId = event.pathParameters?.id;
    const isAvatarAction = path?.includes('/avatar');
    const isUploadUrl = path?.includes('/upload-url');
    const emailParam = event.queryStringParameters?.email;
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'GET') {
            if (empId) {
                const res = await client.query('SELECT * FROM employees WHERE employee_id = $1 AND tenant_id = $2 AND is_active = TRUE', [empId, tenantId]);
                if (res.rows.length === 0) return createResponse(404, { message: "Employee not found" });

                const emp = res.rows[0];
                if (emp.avatar_key) {
                    const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: emp.avatar_key });
                    emp.avatar_url = await getSignedUrl(getS3Client(), command, { expiresIn: 43200 }); // 12 hours
                } else {
                    emp.avatar_url = null;
                }
                return createResponse(200, emp);
            }

            if (emailParam) {
                const res = await client.query('SELECT * FROM employees WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE', [emailParam, tenantId]);
                if (res.rows.length === 0) return createResponse(404, { message: "Employee not found with that email" });

                const emp = res.rows[0];
                if (emp.avatar_key) {
                    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: emp.avatar_key });
                    emp.avatar_url = await getSignedUrl(getS3Client(), command, { expiresIn: 43200 });
                } else {
                    emp.avatar_url = null;
                }
                return createResponse(200, emp);
            }

            if (event.queryStringParameters?.type === 'dropdown') {
                const res = await client.query('SELECT employee_id, name, email FROM employees WHERE tenant_id = $1 AND is_active = TRUE ORDER BY name ASC', [tenantId]);
                return createResponse(200, res.rows);
            }

            // LIST EMPLOYEES
            const page = event.queryStringParameters?.page;
            const limit = event.queryStringParameters?.limit;
            const search = event.queryStringParameters?.search;

            if (page && limit) {
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const offset = (pageNum - 1) * limitNum;

                let countQuery = 'SELECT COUNT(*) FROM employees WHERE tenant_id = $1 AND is_active = TRUE';
                let dataQuery = 'SELECT * FROM employees WHERE tenant_id = $1 AND is_active = TRUE';
                let queryParams = [tenantId];
                let dataParams = [tenantId];

                // Add search filter if present
                if (search) {
                    const searchClause = ' AND (name ILIKE $2 OR email ILIKE $2)';
                    countQuery += searchClause;
                    dataQuery += searchClause;
                    queryParams.push(`%${search}%`);
                    dataParams.push(`%${search}%`);
                }

                // Add pagination
                dataQuery += ' ORDER BY name ASC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
                dataParams.push(limitNum, offset);

                // Execute queries
                const countRes = await client.query(countQuery, queryParams);
                const total = parseInt(countRes.rows[0].count);
                const totalPages = Math.ceil(total / limitNum);

                const res = await client.query(dataQuery, dataParams);
                const employees = res.rows;

                for (const emp of employees) {
                    if (emp.avatar_key) {
                        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: emp.avatar_key });
                        emp.avatar_url = await getSignedUrl(getS3Client(), command, { expiresIn: 43200 });
                    } else {
                        emp.avatar_url = null;
                    }
                }

                return createResponse(200, {
                    data: employees,
                    meta: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages
                    }
                });
            }

            // Default (Legacy): Return all
            const res = await client.query('SELECT * FROM employees WHERE tenant_id = $1 AND is_active = TRUE ORDER BY name ASC', [tenantId]);
            const employees = res.rows;

            // Generate signed URLs for all employees with avatars
            for (const emp of employees) {
                if (emp.avatar_key) {
                    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: emp.avatar_key });
                    emp.avatar_url = await getSignedUrl(getS3Client(), command, { expiresIn: 43200 });
                } else {
                    emp.avatar_url = null;
                }
            }
            return createResponse(200, employees);
        }

        if (httpMethod === 'POST') {
            // 1. Generate Upload URL: POST /employees/{id}/avatar/upload-url
            if (isAvatarAction && isUploadUrl && empId) {
                const key = `employees/${tenantId}/${empId}/avatar.jpg`;
                const command = new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: key,
                    ContentType: 'image/jpeg'
                });
                const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 }); // 5 minutes

                return createResponse(200, { uploadUrl, key });
            }

            // 2. Confirm Upload: POST /employees/{id}/avatar
            if (isAvatarAction && empId) {
                const key = `employees/${tenantId}/${empId}/avatar.jpg`;
                const formattedDate = new Date().toISOString().split('T')[0];
                // Update DB with the key
                const updateRes = await client.query(
                    'UPDATE employees SET avatar_key = $1, updated_at = $2 WHERE employee_id = $3 AND tenant_id = $4 RETURNING *',
                    [key, formattedDate, empId, tenantId]
                );
                return createResponse(200, { message: "Avatar confirmed", employee: updateRes.rows[0] });
            }

            // Standard Employee Creation
            if (!isAvatarAction) {
                const data = JSON.parse(event.body);
                const { header, ...filteredData } = data;
                const countResult = await client.query(
                    'SELECT COUNT(*)::int AS count FROM employees'
                );
                const nextEmployeeId = countResult.rows[0].count + 1;
                console.log(nextEmployeeId);
                const finalData = {
                    employee_id: nextEmployeeId,
                    tenant_id: tenantId,
                    is_active: true,
                    created_at: new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString().split('T')[0],
                    ...filteredData
                };
                const columns = Object.keys(finalData).join(', ');
                const placeholders = Object.keys(finalData)
                    .map((_, i) => `$${i + 1}`)
                    .join(', ');
                const values = Object.values(finalData);
                const res = await client.query(
                    `INSERT INTO employees (${columns}) VALUES (${placeholders}) RETURNING *`,
                    values
                );
                return createResponse(201, res.rows[0]);
            }
        }


        if (httpMethod === 'PUT' && empId && !isAvatarAction) {
            const data = JSON.parse(event.body);
            const restrictedFields = ['employee_id', 'tenant_id', 'created_at', 'updated_at', 'avatar_key'];
            const fields = Object.keys(data).filter(k => !restrictedFields.includes(k));

            if (fields.length === 0) {
                return createResponse(400, { message: "No valid fields provided for update" });
            }

            const values = fields.map(k => data[k]);
            const updatedAt = new Date().toISOString().split('T')[0];

            // Construct SET clause: $2, $3, ...
            const setClause = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
            // Add updated_at to the SET clause
            const finalSetClause = `${setClause}, updated_at = $${fields.length + 2}`;

            const queryParams = [empId, ...values, updatedAt, tenantId];

            const updateRes = await client.query(
                `UPDATE employees SET ${finalSetClause} WHERE employee_id = $1 AND tenant_id = $${queryParams.length} RETURNING *`,
                queryParams
            );

            if (updateRes.rows.length === 0) {
                return createResponse(404, { message: "Employee not found" });
            }

            return createResponse(200, updateRes.rows[0]);
        }

        if (httpMethod === 'DELETE' && empId) {
            // 3. Delete Avatar: DELETE /employees/{id}/avatar
            if (isAvatarAction) {
                const key = `employees/${tenantId}/${empId}/avatar.jpg`;
                const formattedDate = new Date().toISOString().split('T')[0];

                // Delete from S3
                const command = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
                await getS3Client().send(command);

                // Set avatar_key to NULL in DB
                await client.query(
                    'UPDATE employees SET avatar_key = NULL, updated_at = $1 WHERE employee_id = $2 AND tenant_id = $3',
                    [formattedDate, empId, tenantId]
                );

                return createResponse(200, { message: "Avatar deleted successfully" });
            }

            // Soft delete employee
            const body = JSON.parse(event.body || '{}');
            const updatedAt = body.updated_at || new Date().toISOString().split('T')[0];

            const deleteRes = await client.query(
                'UPDATE employees SET is_active = FALSE, updated_at = $2 WHERE employee_id=$1 AND tenant_id=$3 RETURNING employee_id',
                [empId, updatedAt, tenantId]
            );

            if (deleteRes.rowCount === 0) {
                return createResponse(404, { message: "Employee not found" });
            }

            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        console.error(err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
