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
    const tenantId = '79c00000-0000-0000-0000-000000000001';
    let client;
    try {
        client = await pool.connect();
        if (httpMethod === 'POST') {
            const { id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at } = JSON.parse(event.body);
            await client.query('BEGIN');

            const empRes = await client.query('SELECT leaves_remaining, comp_off, location FROM employees WHERE employee_id = $1 AND tenant_id = $2', [employee_id, tenantId]);
            let { leaves_remaining, comp_off, location } = empRes.rows[0];
            comp_off = comp_off || [];

            // Calculate Total Days excluding Holidays
            const start = new Date(start_date);
            const end = new Date(end_date);
            let total_days = 0;

            // Fetch holidays for the tenant and employee location between start and end date
            const holidaysRes = await client.query(
                'SELECT date FROM holidays WHERE tenant_id = $1 AND location = $2 AND is_active = TRUE AND date >= $3 AND date <= $4',
                [tenantId, location, start_date, end_date]
            );
            const holidayDates = new Set(holidaysRes.rows.map(h => h.date));

            // Iterate through dates to count working days
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                // You might want to exclude weekends here if required, but user only mentioned holidays.
                if (!holidayDates.has(dateStr)) {
                    total_days++;
                }
            }

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
                leaves_remaining = (leaves_remaining || 0) - total_days;
            }

            await client.query('UPDATE employees SET leaves_remaining = $1, comp_off = $2 WHERE employee_id = $3 AND tenant_id = $4',
                [leaves_remaining, JSON.stringify(comp_off), employee_id, tenantId]);

            const res = await client.query(
                `INSERT INTO leaves (id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at, tenant_id, total_days) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
                [id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at, tenantId, total_days]
            );

            await client.query('COMMIT');
            return createResponse(201, res.rows[0]);
        }
        if (httpMethod === 'GET' && empId && status) {
            const res = await client.query('SELECT * FROM leaves WHERE employee_id = $1 and status = $2 AND tenant_id = $3', [empId, status, tenantId]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'GET' && empId) {
            const page = event.queryStringParameters?.page;
            const limit = event.queryStringParameters?.limit;

            if (page && limit) {
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const offset = (pageNum - 1) * limitNum;

                const countRes = await client.query('SELECT COUNT(*) FROM leaves WHERE employee_id = $1 AND tenant_id = $2', [empId, tenantId]);
                const total = parseInt(countRes.rows[0].count);
                const totalPages = Math.ceil(total / limitNum);

                const res = await client.query('SELECT * FROM leaves WHERE employee_id = $1 AND tenant_id = $2 ORDER BY start_date DESC LIMIT $3 OFFSET $4', [empId, tenantId, limitNum, offset]);

                return createResponse(200, {
                    data: res.rows,
                    meta: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages
                    }
                });
            }

            // Default (Legacy)
            const res = await client.query('SELECT * FROM leaves WHERE employee_id = $1 AND tenant_id = $2 ORDER BY start_date DESC', [empId, tenantId]);
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