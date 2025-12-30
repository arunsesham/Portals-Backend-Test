import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    
    const empId = event.queryStringParameters?.employee_id;
    const status = event.queryStringParameters?.status;
    let client;
    try {
        client = await pool.connect();
        if (httpMethod === 'POST') {
            const { id, employee_id, start_date, end_date, type, status, reason, manager_id,created_at } = JSON.parse(event.body);
            await client.query('BEGIN');

            const empRes = await client.query('SELECT leaves_remaining, comp_off FROM employees WHERE employee_id = $1', [employee_id]);
            let { leaves_remaining, comp_off } = empRes.rows[0];
            comp_off = comp_off || [];

            // Find an available Comp-Off that is valid for this leave's start_date
            // Rule: valid_from <= leave_date <= expiry_date
            let availableComp = comp_off.find(c => 
                c.status === 'available' && 
                start_date >= c.valid_from && 
                start_date <= c.expiry_date
            );

            if (availableComp) {
                // Reservation: Mark it pending and link this Leave ID
                availableComp.status = 'pending';
                availableComp.leave_id = id;
            } else {
                leaves_remaining = (leaves_remaining || 0) - 1;
            }

            await client.query('UPDATE employees SET leaves_remaining = $1, comp_off = $2 WHERE employee_id = $3',
                [leaves_remaining, JSON.stringify(comp_off), employee_id]);

            const res = await client.query(
                `INSERT INTO leaves (id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at]
            );

            await client.query('COMMIT');
            return createResponse(201, res.rows[0]);
        }
        if (httpMethod === 'GET' && empId && status) {
            const res = await client.query('SELECT * FROM leaves WHERE employee_id = $1 and status = $2', [empId, status]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'GET' && empId) {
            const res = await client.query('SELECT * FROM leaves WHERE employee_id = $1 ORDER BY start_date DESC', [empId]);
            return createResponse(200, res.rows);
        }
        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};