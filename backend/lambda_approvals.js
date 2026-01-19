import pool from './db.js';
import crypto from 'crypto';
import { publishNotification } from './utils_sns.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    const managerId = event.pathParameters?.managerId;
    const status = event.queryStringParameters?.status;

    const tenantId = '79c00000-0000-0000-0000-000000000001';
    if (!managerId) return createResponse(400, { message: "Manager ID required" });

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'GET' && status) {
            const page = event.queryStringParameters?.page;
            const limit = event.queryStringParameters?.limit;

            const baseQuery = `
                SELECT
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
                    r.reason,
                    r.total_days,
                    r.created_at
                FROM (
                    SELECT 
                        id, employee_id, start_date, end_date, type, status, 'leave' AS source, reason, total_days, created_at
                    FROM leaves
                    WHERE status <> 'Pending' AND manager_id = $1 AND tenant_id = $2
                    UNION ALL
                    SELECT 
                        id, employee_id, start_date, end_date, type, status, 'compoff' AS source, reason, total_days, created_at
                    FROM attendance
                    WHERE status <> 'Pending' AND type = 'compoff' AND manager_id = $1 AND tenant_id = $2
                    UNION ALL
                    SELECT 
                        id, employee_id, start_date, end_date, type, status, 'attendance' AS source, reason, total_days, created_at
                    FROM attendance
                    WHERE status <> 'Pending' AND type = 'general attendance' AND manager_id = $1 AND tenant_id = $2
                ) r
                JOIN employees e ON e.employee_id = r.employee_id
            `;

            if (page && limit) {
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const offset = (pageNum - 1) * limitNum;

                // Count Query (Correct me if this is expensive, but for now this works)
                // Wrapping the whole logic is safest for consistent results count.
                // However, I can just count the unions.
                // Simplified count query:
                const countQuery = `
                    SELECT COUNT(*) as count FROM (
                        SELECT id FROM leaves WHERE status <> 'Pending' AND manager_id = $1 AND tenant_id = $2
                        UNION ALL
                        SELECT id FROM attendance WHERE status <> 'Pending' AND type = 'compoff' AND manager_id = $1 AND tenant_id = $2
                        UNION ALL
                        SELECT id FROM attendance WHERE status <> 'Pending' AND type = 'general attendance' AND manager_id = $1 AND tenant_id = $2
                    ) sub
                `;

                const countRes = await client.query(countQuery, [managerId, tenantId]);
                const total = parseInt(countRes.rows[0].count);
                const totalPages = Math.ceil(total / limitNum);

                const finalQuery = `${baseQuery} ORDER BY r.start_date DESC LIMIT $3 OFFSET $4`;
                const res = await client.query(finalQuery, [managerId, tenantId, limitNum, offset]);

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
            const query = `${baseQuery} ORDER BY r.start_date DESC`;
            const res = await client.query(query, [managerId, tenantId]);
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
                r.reason,
                r.total_days,
                r.created_at
            FROM (
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'leave' AS source,
                    reason,
                    total_days,
                    created_at
                FROM leaves
                WHERE status = 'Pending'
                AND manager_id = $1
                AND tenant_id = $2
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'compoff' AS source,
                    reason,
                    total_days,
                    created_at
                FROM attendance
                WHERE status = 'Pending'
                AND type = 'compoff'
                AND manager_id = $1
                AND tenant_id = $2
                UNION ALL
                SELECT 
                    id,
                    employee_id,
                    start_date,
                    end_date,
                    type,
                    status,
                    'attendance' AS source,
                    reason,
                    total_days,
                    created_at
                FROM attendance
                WHERE status = 'Pending'
                AND type = 'general attendance'
                AND manager_id = $1
                AND tenant_id = $2
            ) r
            JOIN employees e
            ON e.employee_id = r.employee_id
            ORDER BY r.start_date DESC
            `;
            const res = await client.query(query, [managerId, tenantId]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'PUT') {
            console.log(JSON.parse(event.body));
            const { id, status, manager_notes, source, updated_at } = JSON.parse(event.body);
            let notificationPayload = null;
            await client.query('BEGIN');

            if (source === 'compoff') {
                // --- CASE A: Manager approves weekend work to EARN a comp-off ---
                const attRes = await client.query('SELECT employee_id, date, start_date, end_date, total_days FROM attendance WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
                if (attRes.rows.length === 0) throw new Error("Attendance record not found");
                const { employee_id, date, start_date, end_date } = attRes.rows[0];
                let { total_days } = attRes.rows[0];

                if (status === 'Approved') {
                    // Logic to handle multiple days credit
                    // If start_date/end_date exist, iterate. If not, use 'date' (single day)
                    // Or simplified: Just loop 'total_days' times if we don't care about specific earned_date for each unit?
                    // Better: If range exists, iterate dates. If single date, just 1.

                    const newEntries = [];

                    if (start_date && end_date) {
                        const start = new Date(start_date);
                        const end = new Date(end_date);
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            // Assuming we credit for every day in range (weekend/holidays logic handled during application?)
                            // Current user phrasing implies "applied compoff for two days", so we credit 2 days.
                            const earned = new Date(d);
                            const validFrom = new Date(earned.getFullYear(), earned.getMonth() + 1, 1);
                            const expiry = new Date(earned.getFullYear(), earned.getMonth() + 4, 0);

                            newEntries.push({
                                comp_id: crypto.randomUUID(),
                                earned_date: d.toISOString().split('T')[0],
                                valid_from: validFrom.toISOString().split('T')[0],
                                expiry_date: expiry.toISOString().split('T')[0],
                                status: 'available',
                                leave_id: null
                            });
                        }
                    } else {
                        // Fallback Single Day
                        const earned = new Date(date);
                        const validFrom = new Date(earned.getFullYear(), earned.getMonth() + 1, 1);
                        const expiry = new Date(earned.getFullYear(), earned.getMonth() + 4, 0);

                        // If total_days > 1 but no range (unlikely but safe fallback), loop?
                        // Assuming single date record = 1 day.
                        newEntries.push({
                            comp_id: crypto.randomUUID(),
                            earned_date: date, // already string usually or Date object
                            valid_from: validFrom.toISOString().split('T')[0],
                            expiry_date: expiry.toISOString().split('T')[0],
                            status: 'available',
                            leave_id: null
                        });
                    }

                    if (newEntries.length > 0) {
                        await client.query(
                            `UPDATE employees SET comp_off = COALESCE(comp_off, '[]'::jsonb) || $1::jsonb WHERE employee_id = $2`,
                            [JSON.stringify(newEntries), employee_id]
                        );
                    }
                }

                // Update Attendance Status (Compoff Request)
                let dateField = status === 'Approved' ? 'approved_on' : (status === 'Rejected' ? 'rejected_on' : null);
                let dateValue = dateField ? new Date().toISOString().split('T')[0] : null;

                if (dateField) {
                    await client.query(
                        `UPDATE attendance SET status = $1, manager_reason = $2, updated_at = $3, ${dateField} = $6 WHERE id = $4 AND tenant_id = $5`,
                        [status, manager_notes, updated_at, id, tenantId, dateValue]
                    );
                } else {
                    await client.query(
                        'UPDATE attendance SET status = $1, manager_reason = $2, updated_at = $3 WHERE id = $4 AND tenant_id = $5',
                        [status, manager_notes, updated_at, id, tenantId]
                    );
                }


                // Prepare Notification Payload
                if (['Approved', 'Rejected'].includes(status)) {
                    notificationPayload = {
                        eventType: status === 'Approved' ? 'COMPOFF_APPROVED' : 'COMPOFF_REJECTED',
                        employeeId: employee_id,
                        tenantId: tenantId,
                        entityType: 'COMPOFF',
                        entityId: id,
                        title: `Comp-off Request ${status}`,
                        message: `Your comp-off request for working on ${new Date(date).toLocaleDateString()} has been ${status.toLowerCase()}.`,
                        icon: status === 'Approved' ? 'check-circle' : 'x-circle',
                        priority: 'NORMAL'
                    };
                }

            } else if (source === 'leave') {
                // --- CASE B: Manager approves/rejects a LEAVE request ---
                const leaveRes = await client.query('SELECT employee_id, total_days, start_date, end_date, type FROM leaves WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
                if (leaveRes.rows.length === 0) throw new Error("Leave record not found");
                const { employee_id, total_days, start_date, end_date, type } = leaveRes.rows[0];

                // Fetch Employee Data for logic
                const empData = await client.query('SELECT leaves_remaining, comp_off FROM employees WHERE employee_id = $1', [employee_id]);
                let { leaves_remaining, comp_off } = empData.rows[0];
                comp_off = comp_off || [];

                // Logic: If Rejected/Revoked, we must REFUND the balance AND restore any linked comp-offs
                // Since application logic is greedy (mix of comp-offs + balance), restoration logic must be mirrored.
                if (status === 'Rejected' || status === 'Revoked') {
                    // 1. Find ALL comp-offs reserved for this leave
                    const linkedComps = comp_off.filter(c => c.leave_id === id);

                    // 2. Restore them to available
                    linkedComps.forEach(c => {
                        c.status = 'available';
                        c.leave_id = null;
                    });

                    // 3. Refund the specific balance deducted
                    // Deducted Balance = Total Days - (Days Covered by CompOffs)
                    const daysCoveredByCompOff = linkedComps.length;
                    const daysDeductedFromBalance = (total_days || 0) - daysCoveredByCompOff;

                    if (daysDeductedFromBalance > 0) {
                        leaves_remaining = (leaves_remaining || 0) + daysDeductedFromBalance;
                    }

                    await client.query(
                        'UPDATE employees SET leaves_remaining = $1, comp_off = $2 WHERE employee_id = $3 AND tenant_id = $4',
                        [leaves_remaining, JSON.stringify(comp_off), employee_id, tenantId]
                    );
                }
                else if (status === 'Approved') {
                    // If Approved, mark ALL linked comp-offs as 'used' forever
                    let compOffUpdated = false;
                    comp_off.forEach(c => {
                        if (c.leave_id === id) {
                            c.status = 'used';
                            compOffUpdated = true;
                        }
                    });

                    if (compOffUpdated) {
                        await client.query(
                            'UPDATE employees SET comp_off = $1 WHERE employee_id = $2 AND tenant_id = $3',
                            [JSON.stringify(comp_off), employee_id, tenantId]
                        );
                    }
                }

                // Update Leave Status
                let dateField = status === 'Approved' ? 'approved_on' : (status === 'Rejected' ? 'rejected_on' : null);
                let dateValue = dateField ? new Date().toISOString().split('T')[0] : null;

                if (dateField) {
                    await client.query(
                        `UPDATE leaves SET status = $1, manager_notes = $2, updated_at = $4, ${dateField} = $6 WHERE id = $3 AND tenant_id = $5`,
                        [status, manager_notes, id, updated_at, tenantId, dateValue]
                    );
                } else {
                    await client.query(
                        'UPDATE leaves SET status = $1, manager_notes = $2, updated_at = $4 WHERE id = $3 AND tenant_id = $5',
                        [status, manager_notes, id, updated_at, tenantId]
                    );
                }


                // Prepare Notification Payload
                if (['Approved', 'Rejected', 'Revoked'].includes(status)) {
                    const sDate = new Date(start_date).toLocaleDateString();
                    const eDate = new Date(end_date).toLocaleDateString();
                    notificationPayload = {
                        eventType: status === 'Approved' ? 'LEAVE_APPROVED' : (status === 'Revoked' ? 'LEAVE_REVOKED' : 'LEAVE_REJECTED'),
                        employeeId: employee_id,
                        tenantId: tenantId,
                        entityType: 'LEAVE',
                        entityId: id,
                        title: `Leave Request ${status}`,
                        message: `Your ${type} request from ${sDate} to ${eDate} has been ${status.toLowerCase()}.`,
                        icon: status === 'Approved' ? 'check-circle' : 'x-circle',
                        priority: 'NORMAL'
                    };
                }

            } else if (source === 'attendance') {
                // --- CASE C: Manager approves/rejects a GENERAL ATTENDANCE regularization request ---
                // Fetch attendance details for notification
                const attRes = await client.query('SELECT employee_id, date FROM attendance WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
                let employee_id = null;
                let date = null;
                if (attRes.rows.length > 0) {
                    employee_id = attRes.rows[0].employee_id;
                    date = attRes.rows[0].date;
                }

                let dateField = status === 'Approved' ? 'approved_on' : (status === 'Rejected' ? 'rejected_on' : null);
                let dateValue = dateField ? new Date().toISOString().split('T')[0] : null;

                if (dateField) {
                    await client.query(
                        `UPDATE attendance SET status = $1, manager_reason = $2, updated_at = $3, ${dateField} = $6 WHERE id = $4 AND tenant_id = $5`,
                        [status, manager_notes, updated_at, id, tenantId, dateValue]
                    );
                } else {
                    await client.query(
                        'UPDATE attendance SET status = $1, manager_reason = $2, updated_at = $3 WHERE id = $4 AND tenant_id = $5',
                        [status, manager_notes, updated_at, id, tenantId]
                    );
                }

                if (['Approved', 'Rejected'].includes(status) && employee_id) {
                    notificationPayload = {
                        eventType: status === 'Approved' ? 'ATTENDANCE_APPROVED' : 'ATTENDANCE_REJECTED',
                        employeeId: employee_id,
                        tenantId: tenantId,
                        entityType: 'ATTENDANCE',
                        entityId: id,
                        title: `Attendance Regularization ${status}`,
                        message: `Your attendance regularization request for ${new Date(date).toLocaleDateString()} has been ${status.toLowerCase()}.`,
                        icon: status === 'Approved' ? 'check-circle' : 'x-circle',
                        priority: 'NORMAL'
                    };
                }
            }


            await client.query('COMMIT');
            console.log(notificationPayload);
            console.log('Transaction committed successfully');
            // --- SNS Notification Logic ---
            if (notificationPayload) {
                // Fire and forget (don't await strictly or catch independently to avoid blocking response? 
                // Wait, if we want to ensure it sends or log error, awaiting is fine as it's typically fast.
                // But we shouldn't fail the response if SNS fails, as DB is already committed.)
                try {
                    await publishNotification(notificationPayload);
                } catch (e) {
                    console.error("Failed to publish notification:", e);
                }
            }

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