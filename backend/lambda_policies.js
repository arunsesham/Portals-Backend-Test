
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const id = event.pathParameters?.id;
    const tenantId = '79c00000-0000-0000-0000-000000000001';
    console.log(id);

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET') {
            const res = await client.query(
                'SELECT * FROM policies WHERE tenant_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
                [tenantId]
            );
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { policy_id, policy_name, policy_type, document_url, created_at, is_active } =
                JSON.parse(event.body);
            console.log(JSON.parse(event.body));
            const activeStatus = is_active !== undefined ? is_active : true;
            const res = await client.query(
                `INSERT INTO policies 
            (policy_id, policy_name, policy_type, document_url, tenant_id, created_at, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
                [policy_id, policy_name, policy_type, document_url, tenantId, created_at, activeStatus]
            );

            return createResponse(201, res.rows[0]);
        }
        if (method === 'PUT' && id) {
            const { policy_name, policy_type, document_url, updated_at } =
                JSON.parse(event.body);

            const res = await client.query(
                `UPDATE policies 
            SET policy_name = $1,
                policy_type = $2,
                document_url = $3,
                updated_at = $5
            WHERE policy_id = $4 AND tenant_id = $6
            RETURNING *`,
                [policy_name, policy_type, document_url, id, updated_at, tenantId]
            );

            return createResponse(200, res.rows[0]);
        }

        if (method === 'DELETE' && id) {
            const { updated_at } = JSON.parse(event.body || '{}');
            await client.query(
                'UPDATE policies SET is_active = FALSE, updated_at = $2 WHERE policy_id = $1 AND tenant_id = $3',
                [id, updated_at, tenantId]
            );
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
