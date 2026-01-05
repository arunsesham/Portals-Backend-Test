
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const id = event.pathParameters?.id;
    const page = event.queryStringParameters?.page
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET' && page) {
            const res = await client.query('SELECT * FROM announcements where page = $1 AND tenant_id = $2 AND is_active = TRUE', [page, tenantId]);
            return createResponse(200, res.rows);
        }

        if (method === 'GET') {
            const res = await client.query('SELECT * FROM announcements WHERE tenant_id = $1 AND is_active = TRUE ORDER BY created_at DESC', [tenantId]);
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { title, description, type, color, id, created_at, page, is_active, from_date, to_date, is_schedule } = JSON.parse(event.body);
            const activeStatus = is_active !== undefined ? is_active : true;
            const res = await client.query(
                'INSERT INTO announcements (title, description, type, color, id, created_at, page, tenant_id, is_active, from_date, to_date, is_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
                [title, description, type, color, id, created_at, page, tenantId, activeStatus, from_date, to_date, is_schedule]
            );
            console.log(res);
            return createResponse(201, res.rows[0]);
        }

        if (method === 'PUT' && id) {
            const { title, description, type, color, updated_at, from_date, to_date, is_schedule } = JSON.parse(event.body);
            const res = await client.query(
                'UPDATE announcements SET title=$1, description=$2, type=$3, color=$4, updated_at=$5, from_date=$6, to_date=$7, is_schedule=$8 WHERE id=$9 AND tenant_id=$10 RETURNING *',
                [title, description, type, color, updated_at, from_date, to_date, is_schedule, id, tenantId]
            );
            return createResponse(200, res.rows[0]);
        }

        if (method === 'DELETE' && id) {
            const { updated_at } = JSON.parse(event.body || '{}');
            await client.query('UPDATE announcements SET is_active = FALSE, updated_at = $2 WHERE id=$1 AND tenant_id=$3', [id, updated_at, tenantId]);
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
