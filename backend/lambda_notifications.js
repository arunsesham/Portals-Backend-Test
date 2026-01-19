import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const tenantId = '79c00000-0000-0000-0000-000000000001';
    const httpMethod = event.httpMethod;
    const path = event.path;

    let client;

    try {
        client = await pool.connect();

        // GET /notifications?email=...
        if (httpMethod === 'GET') {
            const email = event.queryStringParameters?.email;

            if (!email) {
                return createResponse(400, { message: "Email is required" });
            }

            // 1. Get Employee ID
            const empRes = await client.query('SELECT employee_id FROM employees WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
            if (empRes.rows.length === 0) {
                return createResponse(404, { message: "Employee not found" });
            }
            const employeeId = empRes.rows[0].employee_id;

            // 2. Fetch Notifications
            // Fetching all (or limit to recent 50)
            const notifyRes = await client.query(`
                SELECT * 
                FROM notifications 
                WHERE employee_id = $1 AND tenant_id = $2 AND is_read <> TRUE
                ORDER BY created_at DESC 
                LIMIT 50
            `, [employeeId, tenantId]);

            return createResponse(200, notifyRes.rows);
        }

        // PUT /notifications (Mark as Read)
        // Body: { id: "notification_id" } OR { mark_all: true, email: "user@example.com" }
        if (httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const { id, mark_all, email } = body;

            // Case 1: Mark All as Read
            if (mark_all === true && email) {
                // Get Employee ID
                const empRes = await client.query('SELECT employee_id FROM employees WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
                if (empRes.rows.length === 0) {
                    return createResponse(404, { message: "Employee not found" });
                }
                const employeeId = empRes.rows[0].employee_id;

                const updateRes = await client.query(`
                    UPDATE notifications 
                    SET is_read = TRUE 
                    WHERE employee_id = $1 AND tenant_id = $2
                `, [employeeId, tenantId]);

                return createResponse(200, { message: "All notifications marked as read", count: updateRes.rowCount });
            }

            // Case 2: Mark Single as Read
            if (!id) {
                return createResponse(400, { message: "Notification ID or (mark_all + email) is required" });
            }

            const updateRes = await client.query(`
                UPDATE notifications 
                SET is_read = TRUE 
                WHERE id = $1 AND tenant_id = $2
                RETURNING *
            `, [id, tenantId]);

            if (updateRes.rows.length === 0) {
                return createResponse(404, { message: "Notification not found" });
            }

            return createResponse(200, updateRes.rows[0]);
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        console.error("Notifications API Error:", err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
