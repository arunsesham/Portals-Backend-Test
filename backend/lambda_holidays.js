
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

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET' && id) {
            const res = await client.query('SELECT * FROM holidays where id=$1 AND tenant_id=$2 AND is_active=TRUE', [id, tenantId]);
            return createResponse(200, res.rows[0]);
        }

        if (method === 'GET') {
            const res = await client.query('SELECT * FROM holidays WHERE tenant_id=$1 AND is_active=TRUE ORDER BY date ASC', [tenantId]);
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { name, date, type, location, id, created_at, is_active } = JSON.parse(event.body);
            const activeStatus = is_active !== undefined ? is_active : true;
            console.log(JSON.parse(event.body));

            const res = await client.query(
                'INSERT INTO holidays (id, name, date, type, location, created_at, tenant_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [id, name, date, type, location, created_at, tenantId, activeStatus]
            );

            return createResponse(201, res.rows[0]);
        }

        if (method === 'PUT' && id) {
            const { name, date, type, location, updated_at } = JSON.parse(event.body);
            console.log(JSON.parse(event.body));
            const res = await client.query(
                'UPDATE holidays SET name=$1, date=$2, type=$3, location=$4, updated_at=$6 WHERE id=$5 AND tenant_id=$7 RETURNING *',
                [name, date, type, location, id, updated_at, tenantId]
            );
            return createResponse(200, res.rows[0]);
        }

        if (method === 'DELETE' && id) {
            console.log(id);
            const { updated_at } = JSON.parse(event.body || '{}');
            await client.query('UPDATE holidays SET is_active = FALSE, updated_at = $2 WHERE id=$1 AND tenant_id=$3', [id, updated_at, tenantId]);
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
