
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const id = event.pathParameters?.id;
    console.log(id);

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET') {
    const res = await client.query(
        'SELECT * FROM policies ORDER BY created_at DESC'
    );
    return createResponse(200, res.rows);
    }

    if (method === 'POST') {
        const { policy_id, policy_name, policy_type, document_url } =
            JSON.parse(event.body);
        console.log(JSON.parse(event.body));
        const res = await client.query(
            `INSERT INTO policies 
            (policy_id, policy_name, policy_type, document_url) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [policy_id, policy_name, policy_type, document_url]
        );

        return createResponse(201, res.rows[0]);
    }
    if (method === 'PUT' && id) {
        const { policy_name, policy_type, document_url } =
            JSON.parse(event.body);

        const res = await client.query(
            `UPDATE policies 
            SET policy_name = $1,
                policy_type = $2,
                document_url = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE policy_id = $4
            RETURNING *`,
            [policy_name, policy_type, document_url, id]
        );

        return createResponse(200, res.rows[0]);
    }

    if (method === 'DELETE' && id) {
        await client.query(
            'DELETE FROM policies WHERE policy_id = $1',
            [id]
        );
        return createResponse(200, { success: true });
    }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
