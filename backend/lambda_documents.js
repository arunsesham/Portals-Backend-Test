
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET') {
            const folder = event.queryStringParameters?.folder || 'Company';
            const res = await client.query('SELECT * FROM documents WHERE folder = $1 AND tenant_id = $2 AND is_active = TRUE ORDER BY created_at DESC', [folder, tenantId]);
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { name, category, size, folder, employee_id } = JSON.parse(event.body);

            // Simulating S3 upload by generating a mock key/url
            const s3_key = `docs/${folder.toLowerCase()}/${Date.now()}_${name}`;
            const url = `https://s3.amazonaws.com/portals-bucket/${s3_key}`;

            const res = await client.query(
                'INSERT INTO documents (name, category, size, folder, s3_url, employee_id, tenant_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *',
                [name, category, size, folder, url, employee_id, tenantId]
            );
            return createResponse(201, res.rows[0]);
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
