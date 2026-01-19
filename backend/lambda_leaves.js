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
            const { id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at, duration } = JSON.parse(event.body);
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

            // --- Overlap Validation ---
            // Check if adding this leave would exceed 1.0 days for any day in the range.
            // Simplified check: Sum of total_days for overlapping leaves + new total_days.
            // Note: This logic works perfectly for single day checks. For ranges, it's a bit rough but safe.
            // Ideally, we check intersection day-by-day. For now, assuming most Half-Days are single days.

            const overlapCheck = await client.query(`
                SELECT SUM(total_days) as existing_days 
                FROM leaves 
                WHERE employee_id = $1 
                AND status NOT IN ('Rejected', 'Revoked')
                AND (($2 BETWEEN start_date AND end_date) OR ($3 BETWEEN start_date AND end_date) OR (start_date BETWEEN $2 AND $3))
            `, [employee_id, start_date, end_date]);

            const existingDays = parseFloat(overlapCheck.rows[0].existing_days || '0');

            // Handle Half-Day Logic
            if (duration === 'Half') {
                if (total_days === 1) {
                    total_days = 0.5;
                } else if (total_days > 1) {
                    // ... existing multi-day half logic ...
                    total_days = total_days * 0.5;
                }
            }

            // If it's a single day request, we can perfectly enforce the 1.0 limit.
            if (start_date === end_date) {
                if (existingDays + total_days > 1) {
                    return createResponse(409, { message: `Leave overlap detected. You already have ${existingDays} day(s) booked for this date.` });
                }
            } else {
                // For ranges, simplistic check: if ANY overlap exists, it's usually a full day overlap so we block.
                // Unless the existing one is 0.5 and we are asking for range? Complicated.
                // Safer default: If any existing leaves overlap a requested range, just block it to avoid complexity.
                if (existingDays > 0) {
                    // However, user might want to apply Half Day on top of Half Day?
                    // If the range is 1 day, caught above. If range > 1 day, assume full days for now or strict overlap.
                    // Let's rely on standard overlap query for ranges.
                    // Code for strict overlap:
                    const strictOverlap = await client.query(`
                            SELECT id FROM leaves 
                            WHERE employee_id = $1 
                            AND status NOT IN ('Rejected', 'Revoked')
                            AND (($2 BETWEEN start_date AND end_date) OR ($3 BETWEEN start_date AND end_date) OR (start_date BETWEEN $2 AND $3))
                       `, [employee_id, start_date, end_date]);

                    // Refined Logic for Single Day is covered above.
                    // For ranges, we just ensure no "Full" days overlap, or sum doesn't exceed 1?
                    // Let's stick to the Single Day logic requested by user as the primary fix.
                    // If Date Range > 1, and there is ANY overlap, we block.
                    if (strictOverlap.rows.length > 0 && start_date !== end_date) {
                        return createResponse(409, { message: "Leave range overlaps with existing leaves." });
                    }
                }
            }

            // Find available Comp-Offs that are valid for this leave's start_date
            // Rule: valid_from <= leave_date <= expiry_date
            // GREEDY ALLOCATION: Use as many comp-offs as possible (up to total_days)

            // 1. Identify valid candidates
            const validCandidates = comp_off.filter(c =>
                c.status === 'available' &&
                start_date >= c.valid_from &&
                start_date <= c.expiry_date
            );

            // 2. Sort by expiry date (use earliest expiring first)
            validCandidates.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

            // 3. Allocate
            let daysCoveredByCompOff = 0;
            for (let i = 0; i < validCandidates.length && daysCoveredByCompOff < total_days; i++) {
                const comp = validCandidates[i];
                comp.status = 'pending';
                comp.leave_id = id;
                daysCoveredByCompOff++;
            }

            // 4. Deduct remaining from balance
            const remainingToDeduct = total_days - daysCoveredByCompOff;
            if (remainingToDeduct > 0) {
                leaves_remaining = (leaves_remaining || 0) - remainingToDeduct;
            }

            await client.query('UPDATE employees SET leaves_remaining = $1, comp_off = $2 WHERE employee_id = $3 AND tenant_id = $4',
                [leaves_remaining, JSON.stringify(comp_off), employee_id, tenantId]);

            const res = await client.query(
                `INSERT INTO leaves (id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at, tenant_id, total_days, duration) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [id, employee_id, start_date, end_date, type, status, reason, manager_id, created_at, tenantId, total_days, duration || 'Full']
            );

            await client.query('COMMIT');
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'PUT') {
            const { id, start_date, end_date, type, reason, duration, updated_at } = JSON.parse(event.body);

            if (!id) {
                return createResponse(400, { message: "Missing leave ID" });
            }

            await client.query('BEGIN');

            const leaveRes = await client.query('SELECT * FROM leaves WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
            if (leaveRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return createResponse(404, { message: "Leave not found" });
            }
            const currentLeave = leaveRes.rows[0];

            if (currentLeave.status !== 'Pending') {
                await client.query('ROLLBACK');
                return createResponse(400, { message: "Only Pending leaves can be edited." });
            }

            const employee_id = currentLeave.employee_id;
            const empRes = await client.query('SELECT leaves_remaining, comp_off, location FROM employees WHERE employee_id = $1 AND tenant_id = $2', [employee_id, tenantId]);
            let { leaves_remaining, comp_off, location } = empRes.rows[0];
            comp_off = comp_off || [];

            // --- REVERT OLD LEAVE ---
            // 1. Revert Comp-Offs
            let revertedCompOffs = 0;
            comp_off.forEach(c => {
                if (c.leave_id === id) {
                    c.status = 'available';
                    c.leave_id = null;
                    revertedCompOffs++;
                }
            });

            // 2. Revert Leave Balance
            const daysDeductedPreviously = currentLeave.total_days - revertedCompOffs;
            if (daysDeductedPreviously > 0) {
                leaves_remaining = (leaves_remaining || 0) + daysDeductedPreviously;
            }

            // --- APPLY NEW LEAVE ---

            // Calculate Total Days excluding Holidays
            const start = new Date(start_date);
            const end = new Date(end_date);
            let total_days = 0;

            const holidaysRes = await client.query(
                'SELECT date FROM holidays WHERE tenant_id = $1 AND location = $2 AND is_active = TRUE AND date >= $3 AND date <= $4',
                [tenantId, location, start_date, end_date]
            );
            const holidayDates = new Set(holidaysRes.rows.map(h => h.date));

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                if (!holidayDates.has(dateStr)) {
                    total_days++;
                }
            }

            // Handle Half-Day Logic
            if (duration === 'Half') {
                if (total_days === 1) {
                    total_days = 0.5;
                } else if (total_days > 1) {
                    total_days = total_days * 0.5;
                }
            }

            // Overlap Validation (Exclude current leave ID)
            const overlapCheck = await client.query(`
                SELECT SUM(total_days) as existing_days 
                FROM leaves 
                WHERE employee_id = $1 
                AND status NOT IN ('Rejected', 'Revoked')
                AND id != $4
                AND (($2 BETWEEN start_date AND end_date) OR ($3 BETWEEN start_date AND end_date) OR (start_date BETWEEN $2 AND $3))
            `, [employee_id, start_date, end_date, id]);

            const existingDays = parseFloat(overlapCheck.rows[0].existing_days || '0');

            if (start_date === end_date) {
                if (existingDays + total_days > 1) {
                    await client.query('ROLLBACK');
                    return createResponse(409, { message: `Leave overlap detected. You already have ${existingDays} day(s) booked for this date.` });
                }
            } else {
                if (existingDays > 0) {
                    // Strict overlap check for ranges
                    const strictOverlap = await client.query(`
                            SELECT id FROM leaves 
                            WHERE employee_id = $1 
                            AND status NOT IN ('Rejected', 'Revoked')
                            AND id != $4
                            AND (($2 BETWEEN start_date AND end_date) OR ($3 BETWEEN start_date AND end_date) OR (start_date BETWEEN $2 AND $3))
                       `, [employee_id, start_date, end_date, id]);

                    if (strictOverlap.rows.length > 0) {
                        await client.query('ROLLBACK');
                        return createResponse(409, { message: "Leave range overlaps with existing leaves." });
                    }
                }
            }

            // Allocate Comp-Offs (GREEDY)
            const validCandidates = comp_off.filter(c =>
                c.status === 'available' &&
                start_date >= c.valid_from &&
                start_date <= c.expiry_date
            );
            validCandidates.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

            let daysCoveredByCompOff = 0;
            for (let i = 0; i < validCandidates.length && daysCoveredByCompOff < total_days; i++) {
                const comp = validCandidates[i];
                comp.status = 'pending';
                comp.leave_id = id;
                daysCoveredByCompOff++;
            }

            // Deduct remaining from balance
            const remainingToDeduct = total_days - daysCoveredByCompOff;
            if (remainingToDeduct > 0) {
                leaves_remaining = (leaves_remaining || 0) - remainingToDeduct;
            }

            // Update Employee
            await client.query('UPDATE employees SET leaves_remaining = $1, comp_off = $2 WHERE employee_id = $3 AND tenant_id = $4',
                [leaves_remaining, JSON.stringify(comp_off), employee_id, tenantId]);

            // Update Leave
            const updateRes = await client.query(
                `UPDATE leaves 
                 SET start_date = $1, end_date = $2, type = $3, reason = $4, updated_at = $5, total_days = $6, duration = $7
                 WHERE id = $8 AND tenant_id = $9 RETURNING *`,
                [start_date, end_date, type, reason, updated_at, total_days, duration || 'Full', id, tenantId]
            );

            await client.query('COMMIT');
            return createResponse(200, updateRes.rows[0]);
        }
        if (httpMethod === 'GET' && empId && status) {
            const res = await client.query('SELECT id,total_days FROM leaves WHERE employee_id = $1 and status = $2 AND tenant_id = $3', [empId, status, tenantId]);
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'GET' && empId) {
            const page = event.queryStringParameters?.page;
            const limit = event.queryStringParameters?.limit;
            const type = event.queryStringParameters?.type;

            if (type === 'compoff') {
                const res = await client.query('SELECT comp_off FROM employees WHERE employee_id = $1 AND tenant_id = $2', [empId, tenantId]);
                return createResponse(200, res.rows[0]?.comp_off || []);
            }

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