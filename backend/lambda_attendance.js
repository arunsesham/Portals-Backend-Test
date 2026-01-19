
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
            let { id, employee_id, date, status, start_date, end_date, reason, work_mode, manager_id, type, location: providedLocation, created_at, check_in, check_out } = body;

            // Defaults for Punch In
            if (!status) status = 'Present';
            if (!work_mode) work_mode = 'Home';
            if (!type) type = 'Attendance';

            // Derive date from check_in if date is missing and check_in is present
            if (!date && check_in) {
                // Use string splitting to preserve local date and avoid timezone shifts
                date = check_in.split('T')[0];
            }

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

            // 1. Check for Duplicate Attendance
            const check = await client.query('SELECT id FROM attendance WHERE employee_id = $1 AND date = $2 AND status != \'Rejected\'', [employee_id, date]);
            if (check.rows.length > 0) {
                return createResponse(409, { message: "Attendance already recorded for this day." });
            }

            // 2. Check for Overlapping Full-Day Leaves (Allow Half-Day)
            // Checks if there is any APPROVED or PENDING leave that covers this date and is NOT Half Day.
            const leaveCheck = await client.query(`
                SELECT id, duration, type 
                FROM leaves 
                WHERE employee_id = $1 
                AND status NOT IN ('Rejected', 'Revoked')
                AND $2 >= start_date AND $2 <= end_date
            `, [employee_id, date]);

            if (leaveCheck.rows.length > 0) {
                const leave = leaveCheck.rows[0];
                // If duration is NOT explicitly 'Half', we assume it's Full and block attendance.
                if (leave.duration !== 'Half') {
                    return createResponse(409, { message: `Cannot mark attendance. You are on ${leave.type} (Full Day) for this date.` });
                }
                // If 'Half', we allow partial attendance.
            }

            const query = `INSERT INTO attendance (id, date, status,employee_id, start_date, end_date, reason,work_mode, manager_id, type, created_at, tenant_id, total_days, check_in, check_out) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;
            console.log(query, [id, date, status, employee_id, start_date, end_date, reason, work_mode, manager_id, type, created_at, tenantId, total_days, check_in, check_out]);
            const res = await client.query(query, [id, date, status, employee_id, start_date, end_date, reason, work_mode, manager_id, type, created_at, tenantId, total_days, check_in, check_out]);
            return createResponse(201, res.rows[0]);
        }

        if (httpMethod === 'PUT') {
            const body = JSON.parse(event.body);

            // CASE 1: Explicit Edit by ID
            if (body.id) {
                const { id, check_in, check_out, reason, work_mode, date, updated_at, start_date, end_date } = body;

                const findQuery = `SELECT * FROM attendance WHERE id = $1 AND tenant_id = $2`;
                const findRes = await client.query(findQuery, [id, tenantId]);

                if (findRes.rows.length === 0) {
                    return createResponse(404, { message: "Attendance record not found." });
                }

                const record = findRes.rows[0];

                if (record.status !== 'Pending') {
                    return createResponse(400, { message: "Only Pending attendance records can be edited." });
                }

                // Determine effective values (New Value provided ? New Value : Old Value)
                // Note: If user explicitly sends null/empty string to clear check_in, we should handle that. 
                // However, standard COALESCE in SQL prefers non-null. 
                // Just using the input if defined, else record.
                const effectiveStartDate = start_date || record.start_date || date || record.date;
                const effectiveEndDate = end_date || record.end_date || date || record.date;
                const effectiveCheckIn = (check_in !== undefined) ? check_in : record.check_in;
                const effectiveCheckOut = (check_out !== undefined) ? check_out : record.check_out;

                // --- Calculate Total Days (Excluding Holidays) ---
                let total_days = 0;

                // Fetch Employee Location for Holidays
                const empRes = await client.query('SELECT location FROM employees WHERE employee_id = $1 AND tenant_id = $2', [record.employee_id, tenantId]);
                const location = empRes.rows[0]?.location || 'India';

                // Fetch Holidays
                const holidaysRes = await client.query(
                    'SELECT date FROM holidays WHERE tenant_id = $1 AND location = $2 AND is_active = TRUE AND date >= $3 AND date <= $4',
                    [tenantId, location, effectiveStartDate, effectiveEndDate]
                );
                const holidayDates = new Set(holidaysRes.rows.map(h => h.date));

                const start = new Date(effectiveStartDate);
                const end = new Date(effectiveEndDate);

                // Iterate dates
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    if (!holidayDates.has(dateStr)) {
                        total_days++;
                    }
                }

                // --- Calculate Total Hours ---
                let totalHours = 0;
                // "if the check_in is Empty then make sure to coount only the days differnece, if not calculate hours"
                if (effectiveCheckIn && effectiveCheckOut) {
                    const tStart = new Date(effectiveCheckIn.includes('T') ? effectiveCheckIn : `${effectiveStartDate}T${effectiveCheckIn}`);
                    const tEnd = new Date(effectiveCheckOut.includes('T') ? effectiveCheckOut : `${effectiveEndDate}T${effectiveCheckOut}`);
                    if (!isNaN(tStart) && !isNaN(tEnd)) {
                        const diffMs = tEnd - tStart;
                        totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
                    }
                }

                const updateQuery = `
                    UPDATE attendance 
                    SET check_in = COALESCE($1, check_in), 
                        check_out = COALESCE($2, check_out), 
                        reason = COALESCE($3, reason), 
                        work_mode = COALESCE($4, work_mode), 
                        updated_at = $5, 
                        total_hours = $6,
                        start_date = $9,
                        end_date = $10,
                        total_days = $11
                    WHERE id = $7 AND tenant_id = $8
                    RETURNING *
                `;
                const updateRes = await client.query(updateQuery, [check_in, check_out, reason, work_mode, updated_at, totalHours, id, tenantId, effectiveStartDate, effectiveEndDate, total_days]);
                return createResponse(200, updateRes.rows[0]);
            }

            // CASE 2: Legacy Punch Out (Find Active & Close)
            const { employee_id, check_out, updated_at } = body;

            if (!employee_id || !check_out) {
                return createResponse(400, { message: "Missing employee_id or check_out" });
            }

            const findQuery = `
                SELECT id, check_in FROM attendance 
                WHERE employee_id = $1 AND tenant_id = $2
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            const findRes = await client.query(findQuery, [employee_id, tenantId]);

            if (findRes.rows.length === 0) {
                return createResponse(404, { message: "No active attendance record found to check out." });
            }

            const attendanceId = findRes.rows[0].id;
            const checkInTime = findRes.rows[0].check_in;

            // Calculate total hours
            let totalHours = 0;
            if (checkInTime && check_out) {
                const start = new Date(checkInTime);
                const end = new Date(check_out);
                const diffMs = end - start;
                totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2); // Convert to hours
            }

            const updateQuery = `
                UPDATE attendance 
                SET check_out = $1, status = 'Pending', updated_at = $4, total_hours = $5 
                WHERE id = $2 AND tenant_id = $3
                RETURNING *
            `;
            const updateRes = await client.query(updateQuery, [check_out, attendanceId, tenantId, updated_at, totalHours]);

            return createResponse(200, updateRes.rows[0]);
        }

        if (httpMethod === 'DELETE') {
            const body = JSON.parse(event.body);
            const { id } = body;

            if (!id) {
                return createResponse(400, { message: "Missing attendance id" });
            }

            const deleteQuery = `
                UPDATE attendance 
                SET is_active = FALSE 
                WHERE id = $1 AND tenant_id = $2
                RETURNING *
            `;
            const deleteRes = await client.query(deleteQuery, [id, tenantId]);

            if (deleteRes.rows.length === 0) {
                return createResponse(404, { message: "Attendance record not found or already inactive." });
            }

            return createResponse(200, { message: "Attendance record soft deleted.", data: deleteRes.rows[0] });
        }

        if (httpMethod === 'GET') {
            const empId = event.queryStringParameters?.employee_id;
            const page = event.queryStringParameters?.page;
            const limit = event.queryStringParameters?.limit;
            const latest = event.queryStringParameters?.latest;

            if (empId && latest === 'true') {
                const latestRes = await client.query('SELECT * FROM attendance WHERE employee_id = $1 AND tenant_id = $2 AND is_active <> FALSE ORDER BY created_at DESC LIMIT 1', [empId, tenantId]);
                const latestRecord = latestRes.rows[0];

                let punchAction = 'PUNCH_IN';
                // Only prompt for Punch Out if:
                // 1. Record exists
                // 2. Check_out is missing (Open)
                // 3. Check_in exists (It was a valid start, not a draft/empty manual entry)
                if (latestRecord && !latestRecord.check_out && latestRecord.check_in) {
                    punchAction = 'PUNCH_OUT';
                }

                return createResponse(200, { ...latestRecord, punch_action: punchAction });
            }

            if (empId && page && limit) {
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const offset = (pageNum - 1) * limitNum;

                const countRes = await client.query('SELECT COUNT(*) FROM attendance WHERE employee_id = $1 AND tenant_id = $2 AND is_active <> FALSE', [empId, tenantId]);
                const total = parseInt(countRes.rows[0].count);
                const totalPages = Math.ceil(total / limitNum);

                const res = await client.query('SELECT * FROM attendance WHERE employee_id = $1 AND tenant_id = $2 AND is_active <> FALSE ORDER BY date DESC LIMIT $3 OFFSET $4', [empId, tenantId, limitNum, offset]);

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
            if (empId) {
                const res = await client.query('SELECT * FROM attendance WHERE employee_id = $1 AND tenant_id = $2 AND is_active <> FALSE ORDER BY date DESC', [empId, tenantId]);
                return createResponse(200, res.rows);
            }
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};