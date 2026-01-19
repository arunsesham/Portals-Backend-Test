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
    const path = event.path || event.requestContext?.path;

    // Simple routing check
    if (path && path.includes('/attendance-summary')) {
        return await attendanceSummaryHandler(event);
    }

    return await mainDashboardHandler(event);
};

const attendanceSummaryHandler = async (event) => {
    const tenantId = '79c00000-0000-0000-0000-000000000001';
    const email = event.queryStringParameters?.email;
    const period = event.queryStringParameters?.period || 'today';
    const scope = event.queryStringParameters?.scope || 'mine'; // 'mine', 'team', 'company'

    if (!email) {
        return createResponse(400, { message: "Email is required" });
    }

    let client;
    try {
        client = await pool.connect();

        // 1. Determine Date Range
        const { start, end } = getDateRange(period);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 2. Identify User ID
        const userRes = await client.query('SELECT employee_id FROM employees WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
        if (userRes.rows.length === 0) return createResponse(404, { message: "User not found" });
        const userId = userRes.rows[0].employee_id;

        // 3. Build Scope Filter
        let scopeClauseEmployees = "";
        let scopeParams = [];
        let paramIndex = 1;
        let employeeIds = [];

        if (scope === 'mine') {
            employeeIds = [userId];
        } else if (scope === 'team') {
            const teamRes = await client.query('SELECT employee_id FROM employees WHERE (manager_id = $1 OR employee_id = $1) AND tenant_id = $2', [userId, tenantId]);
            employeeIds = teamRes.rows.map(r => r.employee_id);
        } else if (scope === 'company') {
            employeeIds = null;
        }

        // -- ATTENDANCE DATA --
        // Use total_days from DB as requested by user
        let attQuery = `
            SELECT 
                work_mode,
                SUM(COALESCE(total_days, 1)) as total_days
            FROM attendance
            WHERE 
                tenant_id = $3
                AND start_date::date <= $2::date 
                AND end_date::date >= $1::date
                AND status NOT IN ('Rejected')
                AND is_active <> false
        `;

        let leavesQuery = `
            SELECT 
                type,
                SUM(COALESCE(total_days, 1)) as total_days
            FROM leaves
            WHERE 
                tenant_id = $3
                AND start_date::date <= $2::date 
                AND end_date::date >= $1::date
                AND status = 'Approved'
                AND is_active <> false
        `;

        const queryParams = [startStr, endStr, tenantId];

        if (employeeIds !== null) {
            attQuery += ` AND employee_id = ANY($4)`;
            leavesQuery += ` AND employee_id = ANY($4)`;
            queryParams.push(employeeIds);
        }

        attQuery += ` GROUP BY work_mode`;
        leavesQuery += ` GROUP BY type`;

        const [attRes, leavesRes] = await Promise.all([
            client.query(attQuery, queryParams),
            client.query(leavesQuery, queryParams)
        ]);

        // 5. Aggregation & Formatting
        const summary = {
            "Work From Office": 0,
            "Work From Home": 0,
            "Leaves": 0,
            "Comp Off": 0,
            "On Duty": 0 // Just in case
        };

        // Process Attendance
        attRes.rows.forEach(row => {
            const mode = row.work_mode || 'Work From Office'; // Default
            const days = parseInt(row.total_days || 0);

            // Normalize keys
            if (mode.match(/home|remote/i)) {
                summary["Work From Home"] += days;
            } else if (mode.match(/office|wfo/i)) {
                summary["Work From Office"] += days;
            } else {
                // Other modes? 'On Duty', 'Client Visit'?
                if (!summary[mode]) summary[mode] = 0;
                summary[mode] += days;
            }
        });

        // Process Leaves
        leavesRes.rows.forEach(row => {
            const type = row.type || 'Leave';
            const days = parseInt(row.total_days || 0);

            if (type === 'Comp Off') {
                summary["Comp Off"] += days;
            } else {
                // Group all other leaves as "Leaves" or keep separate?
                // Prompt: "leaves, work from home, compoff, work from office"
                // It implies general Leaves. But distinguishing Sick vs Casual might be nice. 
                // For a pie chart, too many slices is bad. Let's group "Leaves" but maybe keep detail if needed.
                // Refencing prompt: "counts the total_days for each catogory like leaves, work from home, compoff, work from office"
                // I will add to "Leaves" generic bucket, but also store breakdown if useful? 
                // Let's stick to the prompt's categories: Leaves, WFH, CompOff, WFO.

                summary["Leaves"] += days;
            }
        });

        // Format for Pie Chart (Chart.js / Recharts usually want Array of Objects or Key-Value)
        // Providing easy format:
        const responseData = Object.entries(summary).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);

        return createResponse(200, {
            scope,
            period,
            start_date: startStr,
            end_date: endStr,
            summary: responseData,
            raw_breakdown: summary // providing raw object too for easy lookup
        });

    } catch (err) {
        console.error("Attendance Summary Error:", err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};

const getDateRange = (periodKey) => {
    const today = new Date(); // Use current server time, ideally UTC or configured timezone. 
    // Assuming local server time is acceptable as per prompt metadata (IST).
    // To ensure consistency, we should maybe operate on Date objects carefully.

    // Helper to get start/end of...
    const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const getEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    let start = getStartOfDay(today);
    let end = getEndOfDay(today);

    switch (periodKey) {
        case 'today':
            // Already set
            break;
        case 'this_week':
            // Mon - Sun
            const day = start.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            break;
        case 'last_week':
            // Previous week Mon-Sun
            const dayLast = start.getDay();
            const diffLast = start.getDate() - dayLast + (dayLast === 0 ? -6 : 1) - 7;
            start.setDate(diffLast);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            break;
        case 'this_month':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'last_month':
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            // End of last month is 0th day of this month
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'this_quarter':
            const q = Math.floor(today.getMonth() / 3);
            start = new Date(today.getFullYear(), q * 3, 1);
            end = new Date(today.getFullYear(), (q + 1) * 3, 0);
            break;
        case 'last_quarter':
            const qLast = Math.floor(today.getMonth() / 3) - 1;
            // Handle Q1 -> QLastYear
            if (qLast < 0) {
                start = new Date(today.getFullYear() - 1, 9, 1); // Oct 1st
                end = new Date(today.getFullYear() - 1, 12, 0); // Dec 31st
            } else {
                start = new Date(today.getFullYear(), qLast * 3, 1);
                end = new Date(today.getFullYear(), (qLast + 1) * 3, 0);
            }
            break;
        case 'this_year':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            // Default to today if unknown
            break;
    }

    // Normalize End (ensure it covers the full day in DB comparison if using timestamps, 
    // but here we send YYYY-MM-DD strings so it's inclusive)
    return { start, end };
};

const mainDashboardHandler = async (event) => {
    const emailParam = event.queryStringParameters?.email;
    const tenantId = '79c00000-0000-0000-0000-000000000001';
    let client;

    try {
        client = await pool.connect();

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // 1. Fetch Birthdays & Anniversaries (DOB / DOJ are strings)
        const employeesRes = await client.query(`
            SELECT 
                name,
                avatar_url AS avatar,
                dob,
                join_date,
                employee_id
            FROM employees
            WHERE 
                (EXTRACT(MONTH FROM dob::date) = $1
                OR EXTRACT(MONTH FROM join_date::date) = $1)
                AND tenant_id = $2
                AND is_active = TRUE
        `, [month, tenantId]);

        // Leaves in the month
        const leaves = await client.query(`
            SELECT
                e.name,
                e.avatar_url AS avatar,
                e.employee_id,
                l.start_date,
                l.end_date,
                l.type,
                l.status
            FROM employees e
            JOIN leaves l ON e.employee_id = l.employee_id
            WHERE
                (EXTRACT(MONTH FROM l.start_date::date) = $1
                OR EXTRACT(MONTH FROM l.end_date::date) = $1)
                AND e.tenant_id = $2
                AND e.is_active = TRUE
        `, [month, tenantId]);

        // Announcements
        const announcementsRes = await client.query(`SELECT *
            FROM public.announcements
            WHERE "type" <> 'Pages'
            AND tenant_id = $1
            AND is_active = TRUE
            AND (
                    is_schedule = FALSE
                    OR (
                        is_schedule = TRUE
                        AND CURRENT_DATE BETWEEN
                            from_date::date AND to_date::date
                    )
                )
            ORDER BY created_at::timestamp DESC`, [tenantId]);

        // User rank
        const userRank = await client.query(`
            SELECT * FROM (
                SELECT
                    employee_id,
                    name,
                    email,
                    leaves_remaining,
                    leaderboard_points,
                    DENSE_RANK() OVER (ORDER BY leaderboard_points DESC) AS rank
                FROM employees
                WHERE tenant_id = $1 AND is_active = TRUE
            ) ranked
            WHERE email = $2
        `, [tenantId, emailParam]);

        // Leaderboard
        const leaderboardRes = await client.query(`
            SELECT
                employee_id,
                name,
                avatar_url AS avatar,
                position,
                leaderboard_points AS points,
                RANK() OVER (ORDER BY leaderboard_points DESC) AS rank
            FROM employees
            WHERE tenant_id = $1 AND is_active = TRUE
            ORDER BY leaderboard_points DESC
            LIMIT 10
        `, [tenantId]);

        // Policies
        const policies = await client.query(`
            SELECT
                policy_id,
                policy_name,
                policy_type,
                document_url,
                created_at,
                updated_at,
                is_active,
                description,
                created_by
            FROM policies
            WHERE tenant_id = $1
        `, [tenantId]);

        // Leaves this month
        const leaves_thismonth = await client.query(`
            SELECT
                e.email,
                SUM(
                    GREATEST(
                        0,
                        LEAST(l.end_date::date, m.month_end)
                        - GREATEST(l.start_date::date, m.month_start)
                        + 1
                    )
                ) AS leave_days_in_month
            FROM employees e
            JOIN leaves l ON e.employee_id = l.employee_id
            CROSS JOIN (
                SELECT
                    make_date($2, $1, 1)::date AS month_start,
                    (make_date($2, $1, 1) + INTERVAL '1 month - 1 day')::date AS month_end
            ) m
            WHERE
                e.email = $3
                AND l.status = 'Approved'
                AND l.start_date::date <= m.month_end
                AND l.end_date::date >= m.month_start
                AND e.tenant_id = $4
            GROUP BY e.email
        `, [month, year, emailParam, tenantId]);

        // Recent Activities
        const userIdRes = await client.query('SELECT employee_id FROM employees WHERE email = $1 AND tenant_id = $2', [emailParam, tenantId]);
        let recentActivities = {};

        if (userIdRes.rows.length > 0) {
            const userId = userIdRes.rows[0].employee_id;

            const [lastLeaveRes, lastAttendanceRes, nextHolidayRes] = await Promise.all([
                client.query(`
                    SELECT type, start_date, status 
                    FROM leaves 
                    WHERE employee_id = $1 AND tenant_id = $2
                    AND is_active <> FALSE
                    ORDER BY start_date::date DESC 
                    LIMIT 1
                `, [userId, tenantId]),
                client.query(`
                    SELECT start_date, end_date, check_in, total_days 
                    FROM attendance 
                    WHERE employee_id = $1 AND tenant_id = $2 AND is_active <> FALSE
                    ORDER BY start_date::date DESC 
                    LIMIT 1
                `, [userId, tenantId]),
                client.query(`
                    SELECT name, date 
                    FROM holidays 
                    WHERE date::date >= CURRENT_DATE AND tenant_id = $1 
                    ORDER BY date::date ASC 
                    LIMIT 1
                `, [tenantId])
            ]);

            recentActivities = {
                last_leave: lastLeaveRes.rows[0] || null,
                last_attendance: lastAttendanceRes.rows[0] || null,
                next_holiday: nextHolidayRes.rows[0] || null
            };
        }

        // Activity Pulse (static)
        const activityGraph = [
            { name: 'Mon', hours: 8.5 },
            { name: 'Tue', hours: 7.2 },
            { name: 'Wed', hours: 9.0 },
            { name: 'Thu', hours: 8.0 },
            { name: 'Fri', hours: 6.5 },
            { name: 'Sat', hours: 0 },
            { name: 'Sun', hours: 0 }
        ];

        return createResponse(200, {
            birthdays: employeesRes.rows
                .filter(p => p.dob && new Date(p.dob).getMonth() + 1 === month)
                .map(p => ({
                    name: p.name,
                    avatar: p.avatar,
                    date: new Date(p.dob).toLocaleDateString('default', {
                        month: 'short',
                        day: 'numeric'
                    })
                })),

            anniversaries: employeesRes.rows
                .filter(p => p.join_date && new Date(p.join_date).getMonth() + 1 === month)
                .map(p => ({
                    name: p.name,
                    avatar: p.avatar,
                    years: year - new Date(p.join_date).getFullYear(),
                    date: new Date(p.join_date).toLocaleDateString('default', {
                        month: 'short',
                        day: 'numeric'
                    })
                })),

            leaves: leaves.rows,

            announcements: announcementsRes.rows.map(a => ({
                id: a.id,
                title: a.title,
                desc: a.description,
                type: a.type,
                color: a.color,
                date: a.created_at
            })),

            leaderboard: leaderboardRes.rows,
            userRankings: userRank.rows,
            activityGraph,
            policies: policies.rows,
            activityGraph,
            policies: policies.rows,
            leaves_thismonth: leaves_thismonth.rows[0]?.leave_days_in_month ?? 0,
            recent_activities: recentActivities
        });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};