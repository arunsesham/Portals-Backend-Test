
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    let client;
    try {
        client = await pool.connect();
        const { employee_id, points, action_by_role } = JSON.parse(event.body);

        if (action_by_role !== 'Admin' && action_by_role !== 'HR') {
            return createResponse(403, { message: "Unauthorized: Only HR or Admin can adjust leaderboard points." });
        }

        const res = await client.query(
            'UPDATE employees SET leaderboard_points = $1 WHERE employee_id = $2 RETURNING *',
            [points, employee_id]
        );

        return createResponse(200, res.rows[0]);
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
