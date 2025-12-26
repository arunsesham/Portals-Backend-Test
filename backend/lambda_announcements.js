
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const id = event.pathParameters?.id;

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET') {
            const res = await client.query('SELECT * FROM announcements ORDER BY created_at DESC');
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { title, description, type, color, id, created_at} = JSON.parse(event.body);
            const res = await client.query(
                'INSERT INTO announcements (title, description, type, color, id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [title, description, type, color, id, created_at]
            );
            console.log(res);
            return createResponse(201, res.rows[0]);
        }

        if (method === 'PUT' && id) {
            const { title, description, type, color } = JSON.parse(event.body);
            const res = await client.query(
                'UPDATE announcements SET title=$1, description=$2, type=$3, color=$4 WHERE id=$5 RETURNING *',
                [title, description, type, color, id]
            );
            return createResponse(200, res.rows[0]);
        }

        if (method === 'DELETE' && id) {
            await client.query('DELETE FROM announcements WHERE id=$1', [id]);
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
