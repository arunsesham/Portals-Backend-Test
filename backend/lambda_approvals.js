import pool from './db.js';
import crypto from 'crypto';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    const managerId = event.pathParameters?.managerId;
    const status = event.queryStringParameters?.status;

    if (!managerId) return createResponse(400, { message: "Manager ID required" });

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'GET' && status) {
            // Fetch items only for direct reports
            // Segregate: 'leave' = applying for leave, 'compoff_earning' = weekend work approval
            const query = `SELECT
                r.id,
                r.employee_id,
                e.name AS employee_name,
                e.role,
                e.avatar_url,
                r.start_date,
                r.end_date,
                r.type,
                r.status,
                r.source,
                r.reason
            FROM (
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'leave' AS source,
                    reason
                FROM leaves
                WHERE status <> 'Pending'
                AND manager_id = $1
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'compoff' AS source,
                    reason
                FROM attendance
                WHERE status <> 'Pending'
                AND type = 'compoff'
                AND manager_id = $1
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'attendance' AS source,
                    reason
                FROM attendance
                WHERE status <> 'Pending'
                AND type = 'general attendance'
                AND manager_id = $1
            ) r
            JOIN employees e
            ON e.employee_id = r.employee_id
            ORDER BY r.start_date DESC
            `;
            const res = await client.query(query, [managerId]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'GET') {
            // Fetch items only for direct reports
            // Segregate: 'leave' = applying for leave, 'compoff_earning' = weekend work approval
            const query = `SELECT
                r.id,
                r.employee_id,
                e.name AS employee_name,
                e.role,
                e.avatar_url,
                r.start_date,
                r.end_date,
                r.type,
                r.status,
                r.source,
                r.reason
            FROM (
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'leave' AS source,
                    reason
                FROM leaves
                WHERE status = 'Pending'
                AND manager_id = $1
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'compoff' AS source,
                    reason
                FROM attendance
                WHERE status = 'Pending'
                AND type = 'compoff'
                AND manager_id = $1
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'attendance' AS source,
                    reason
                FROM attendance
                WHERE status = 'Pending'
                AND type = 'general attendance'
                AND manager_id = $1
            ) r
            JOIN employees e
            ON e.employee_id = r.employee_id
            ORDER BY r.start_date DESC
            `;
            const res = await client.query(query, [managerId]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'PUT') {
            console.log(JSON.parse(event.body));
            const { id, status, manager_notes, source, updated_at } = JSON.parse(event.body);
            await client.query('BEGIN');

            if (source === 'compoff') {
                // --- CASE A: Manager approves weekend work to EARN a comp-off ---
                const attRes = await client.query('SELECT employee_id, date FROM attendance WHERE id = $1', [id]);
                if (attRes.rows.length === 0) throw new Error("Attendance record not found");
                const { employee_id, date } = attRes.rows[0];

                if (status === 'Approved') {
                    const earned = new Date(date);
                    // Valid from: 1st of next month
                    const validFrom = new Date(earned.getFullYear(), earned.getMonth() + 1, 1);
                    // Expiry: Last day of 3rd month after earning (e.g., Earned Jan -> Valid Feb, Mar, Apr -> Expires Apr 30)
                    const expiry = new Date(earned.getFullYear(), earned.getMonth() + 4, 0);

                    const newEntry = {
                        comp_id: crypto.randomUUID(),
                        earned_date: date,
                        valid_from: validFrom.toISOString().split('T')[0],
                        expiry_date: expiry.toISOString().split('T')[0],
                        status: 'available',
                        leave_id: null
                    };

                    await client.query(
                        `UPDATE employees SET comp_off = COALESCE(comp_off, '[]'::jsonb) || $1::jsonb WHERE employee_id = $2`,
                        [JSON.stringify([newEntry]), employee_id]
                    );
                }
                await client.query('UPDATE attendance SET status = $1, updated_at=$3 WHERE id = $2', [status, id, updated_at]);

            } else if (source === 'leave') {
                // --- CASE B: Manager approves/rejects a LEAVE request ---
                const leaveRes = await client.query('SELECT employee_id FROM leaves WHERE id = $1', [id]);
                if (leaveRes.rows.length === 0) throw new Error("Leave record not found");
                const employeeId = leaveRes.rows[0].employee_id;

                const empData = await client.query('SELECT leave_balance, comp_off FROM employees WHERE employee_id = $1', [employeeId]);
                let { leave_balance, comp_off } = empData.rows[0];
                comp_off = comp_off || [];

                // Find if a specific comp-off was reserved for this leave
                const linkedComp = comp_off.find(c => c.leave_id === id);

                if (status === 'Approved') {
                    if (linkedComp) linkedComp.status = 'used';
                } else if (status === 'Rejected' || status === 'Revoked') {
                    if (linkedComp) {
                        // Reflect back: restore this specific comp-off to available
                        linkedComp.status = 'available';
                        linkedComp.leave_id = null;
                    } else {
                        // Restore standard leave balance
                        leave_balance = (leave_balance || 0) + 1;
                    }
                }

                await client.query(
                    'UPDATE employees SET leave_balance = $1, comp_off = $2 WHERE employee_id = $3',
                    [leave_balance, JSON.stringify(comp_off), employeeId]
                );
                await client.query(
                    'UPDATE leaves SET status = $1, manager_notes = $2, updated_at = $4 WHERE id = $3', 
                    [status, manager_notes, id, updated_at]
                );
            }

            await client.query('COMMIT');
            return createResponse(200, { message: "Action processed successfully." });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};