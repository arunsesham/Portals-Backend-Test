
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
                    emp.avatar_url = await getSignedUrl(s3Client, command, { expiresIn: 43200 });
                } else {
                    emp.avatar_url = null;
                }
                return createResponse(200, emp);
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
                        emp.avatar_url = await getSignedUrl(s3Client, command, { expiresIn: 43200 });
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
                    emp.avatar_url = await getSignedUrl(s3Client, command, { expiresIn: 43200 });
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
                // Update DB with the key
                const updateRes = await client.query(
                    'UPDATE employees SET avatar_key = $1, updated_at = NOW() WHERE employee_id = $2 AND tenant_id = $3 RETURNING *',
                    [key, empId, tenantId]
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
            const { updated_at, ...rest } = data;
            const fields = Object.keys(rest).filter(k => k !== 'employee_id');
            const values = fields.map(k => rest[k]);

            const setClauseWithUpdate = [...fields, 'updated_at'].map((k, i) => `${k} = $${i + 2}`).join(', ');
            const valuesWithUpdate = [...values, updated_at || new Date().toISOString().split('T')[0]];

            const updateRes = await client.query(
                `UPDATE employees SET ${setClauseWithUpdate} WHERE employee_id = $1 AND tenant_id = $${valuesWithUpdate.length + 2} RETURNING *`,
                [empId, ...valuesWithUpdate, tenantId]
            );

            return createResponse(200, updateRes.rows[0]);
        }

        if (httpMethod === 'DELETE' && empId) {
            // 3. Delete Avatar: DELETE /employees/{id}/avatar
            if (isAvatarAction) {
                const key = `employees/${tenantId}/${empId}/avatar.jpg`;

                // Delete from S3
                const command = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
                await getS3Client().send(command);

                // Set avatar_key to NULL in DB
                await client.query(
                    'UPDATE employees SET avatar_key = NULL, updated_at = NOW() WHERE employee_id = $1 AND tenant_id = $2',
                    [empId, tenantId]
                );

                return createResponse(200, { message: "Avatar deleted successfully" });
            }

            // Soft delete employee (existing logic fallback if needed, but wasn't in original view)
            // Assuming previous soft delete logic was in a separate block or user wants me to add it?
            // The previous context showed no explicit DELETE handler in the view, but the conversation history mentioned soft deletes.
            // I will assume for now I only need to handle the avatar DELETE here as per request.
            // But wait, the previous code block ended at line 100 which was inside PUT.
            // I need to be careful not to overwrite existing DELETE logic if it existed further down.
            // Let me check if there was a DELETE block in the previous `view_file` output.
            // The `view_file` output ended at line 100 which was the end of PUT. 
            // I will append the DELETE block.
        }

        if (httpMethod === 'DELETE' && empId) {
            console.log(empId);
            // Employees usually don't have is_active in the schema block provided? 
            // Schema has `leaves_remaining`, etc. `is_active` NOT listed in schema for employees table in what I saw?
            // "employees" table schema provided: is_admin bool. NO is_active column shown in schema from Step 23.
            // Checking Step 23 schema for employees: ... is_admin bool. NO is_active.
            // User request: "for all the deletes make sure to use the 'is_active' boolean flag to update".
            // I should add Soft Delete logic assuming the column EXISTS or will exist.
            // I will assume standard requirement applies even if schema missed it, or I should verify.
            // Plan said: "User Review Required... assumes all tables have is_active". User said PROCEED.
            // So I proceed assuming it exists.

            const { updated_at } = JSON.parse(event.body || '{}');
            await client.query('UPDATE employees SET is_active = FALSE, updated_at = $2 WHERE employee_id=$1 AND tenant_id=$3', [empId, updated_at, tenantId]);
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
