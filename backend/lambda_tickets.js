
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'POST') {
            const { employee_id, subject, category, description } = JSON.parse(event.body);
            const query = `INSERT INTO helpdesk_tickets (employee_id, subject, category, description) VALUES ($1, $2, $3, $4) RETURNING *`;
            const res = await client.query(query, [employee_id, subject, category, description]);
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'GET') {
            const res = await client.query('SELECT * FROM helpdesk_tickets ORDER BY created_at DESC');
            return createResponse(200, res.rows);
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
