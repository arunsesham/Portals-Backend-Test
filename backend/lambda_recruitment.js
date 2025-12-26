
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
            const res = await client.query('SELECT * FROM job_postings ORDER BY id DESC');
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { title, department, description, type, url, referral_bonus } = JSON.parse(event.body);
            const res = await client.query(
                'INSERT INTO job_postings (title, department, description, type, url, referral_bonus) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [title, department, description, type, url, referral_bonus || '$0']
            );
            return createResponse(201, res.rows[0]);
        }

        if (method === 'PUT' && id) {
            const { title, department, description, type, url, status, referral_bonus } = JSON.parse(event.body);
            const res = await client.query(
                'UPDATE job_postings SET title=$1, department=$2, description=$3, type=$4, url=$5, status=$6, referral_bonus=$7 WHERE id=$8 RETURNING *',
                [title, department, description, type, url, status, referral_bonus, id]
            );
            return createResponse(200, res.rows[0]);
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
