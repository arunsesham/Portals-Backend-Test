
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
            const { employee_id, earned_date, reason, id } = JSON.parse(event.body);
            
            const date = new Date(earned_date);
            const expiryDate = new Date(date.getFullYear(), date.getMonth() + 4, 0);

            const query = `INSERT INTO compoff_ledger (employee_id, earned_date, expiry_date, status, reason,id) 
                           VALUES ($1, $2, $3, 'Available', $4, $5) RETURNING *`;
            const res = await client.query(query, [employee_id, earned_date, expiryDate, reason, id]);
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'GET') {
            const empId = event.queryStringParameters?.employee_id;
            await client.query("UPDATE compoff_ledger SET status = 'Expired' WHERE expiry_date < CURRENT_DATE AND status = 'Available'");
            
            const res = await client.query('SELECT * FROM compoff_ledger WHERE employee_id = $1 ORDER BY earned_date DESC', [empId]);
            return createResponse(200, res.rows);
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
