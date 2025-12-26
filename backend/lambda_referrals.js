
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;

    let client;
    try {
        client = await pool.connect();

        if (method === 'POST') {
            const { candidate_name, email, job_id, referred_by, resume_url } = JSON.parse(event.body);
            const res = await client.query(
                'INSERT INTO referrals (candidate_name, email, job_id, referred_by, resume_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [candidate_name, email, job_id, referred_by, resume_url]
            );
            return createResponse(201, res.rows[0]);
        }

        if (method === 'GET') {
            const userId = event.queryStringParameters?.referred_by;
            const res = await client.query(`
                SELECT r.*, j.title as job_title 
                FROM referrals r 
                JOIN job_postings j ON r.job_id = j.id 
                WHERE r.referred_by = $1 
                ORDER BY r.created_at DESC
            `, [userId]);
            return createResponse(200, res.rows);
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
