
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
            console.log(JSON.parse(event.body));
            const { id, employee_id, date, status, start_date, end_date, reason,work_mode, manager_id, type, location } = JSON.parse(event.body);
            
            // const check = await client.query('SELECT id FROM attendance WHERE employee_id = $1 AND date = $2', [employee_id, date]);
            // if (check.rows.length > 0) {
            //     return createResponse(409, { message: "Attendance or leave already recorded for this day." });
            // }

            const query = `INSERT INTO attendance (id, date, status,employee_id, start_date, end_date, reason,work_mode, manager_id, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
            console.log(query, [id, date, status, employee_id, start_date, end_date, reason,work_mode, manager_id, type]);
            const res = await client.query(query, [id, date, status, employee_id, start_date, end_date, reason,work_mode, manager_id, type]);
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'GET') {
            const empId = event.queryStringParameters?.employee_id;
            const res = await client.query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC', [empId]);
            return createResponse(200, res.rows);
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
