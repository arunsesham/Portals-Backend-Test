
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'POST') {
            console.log(JSON.parse(event.body));
            // Ensure start_date and end_date are derived from date if missing (handling single day case)
            const body = JSON.parse(event.body);
            let { id, employee_id, date, status, start_date, end_date, reason, work_mode, manager_id, type, location: providedLocation, created_at } = body;

            if (!start_date) start_date = date;
            if (!end_date) end_date = date;

            // Fetch Employee Location
            const empRes = await client.query('SELECT location FROM employees WHERE employee_id = $1 AND tenant_id = $2', [employee_id, tenantId]);
            const location = empRes.rows[0]?.location || providedLocation || 'India'; // Fallback

            // Calculate Total Days excluding Holidays
            const start = new Date(start_date);
            const end = new Date(end_date);
            let total_days = 0;

            // Fetch holidays based on location
            const holidaysRes = await client.query(
                'SELECT date FROM holidays WHERE tenant_id = $1 AND location = $2 AND is_active = TRUE AND date >= $3 AND date <= $4',
                [tenantId, location, start_date, end_date]
            );
            const holidayDates = new Set(holidaysRes.rows.map(h => h.date));

            // Iterate
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                if (!holidayDates.has(dateStr)) {
                    total_days++;
                }
            }

            // const check = await client.query('SELECT id FROM attendance WHERE employee_id = $1 AND date = $2', [employee_id, date]);
            // if (check.rows.length > 0) {
            //     return createResponse(409, { message: "Attendance or leave already recorded for this day." });
            // }

            const query = `INSERT INTO attendance (id, date, status,employee_id, start_date, end_date, reason,work_mode, manager_id, type, created_at, tenant_id, total_days) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;
            console.log(query, [id, date, status, employee_id, start_date, end_date, reason, work_mode, manager_id, type, created_at, tenantId, total_days]);
            const res = await client.query(query, [id, date, status, employee_id, start_date, end_date, reason, work_mode, manager_id, type, created_at, tenantId, total_days]);
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'GET') {
            const empId = event.queryStringParameters?.employee_id;
            const res = await client.query('SELECT * FROM attendance WHERE employee_id = $1 AND tenant_id = $2 ORDER BY date DESC', [empId, tenantId]);
            return createResponse(200, res.rows);
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
