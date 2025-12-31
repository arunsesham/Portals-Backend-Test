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
    const emailParam = event.queryStringParameters?.email;
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
                EXTRACT(MONTH FROM dob::date) = $1
                OR EXTRACT(MONTH FROM join_date::date) = $1
        `, [month]);

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
                EXTRACT(MONTH FROM l.start_date::date) = $1
                OR EXTRACT(MONTH FROM l.end_date::date) = $1
        `, [month]);

        // Announcements
        const announcementsRes = await client.query(`
            SELECT * FROM announcements WHERE TYPE <> 'Pages'
            ORDER BY created_at DESC
            LIMIT 5
        `);

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
            ) ranked
            WHERE email = $1
        `, [emailParam]);

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
            ORDER BY leaderboard_points DESC
            LIMIT 10
        `);

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
        `);

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
            GROUP BY e.email
        `, [month, year, emailParam]);

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
            leaves_thismonth: leaves_thismonth.rows[0]?.leave_days_in_month ?? 0
        });

    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};