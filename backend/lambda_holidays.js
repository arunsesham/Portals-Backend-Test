
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const id = event.pathParameters?.id;

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET' && id) {
            const res = await client.query('SELECT * FROM holidays where id=$1',[id]);
            return createResponse(200, res.rows[0]);
        }

        if (method === 'GET') {
            const res = await client.query('SELECT * FROM holidays ORDER BY date ASC');
            return createResponse(200, res.rows);
        }

        if (method === 'POST') {
            const { name, date, type, location,id, created_at } = JSON.parse(event.body);
            console.log(JSON.parse(event.body));
            console.log(
                'INSERT INTO holidays (id, name, date, type, location, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [id, name, date, type, location, created_at]
            );
            const res = await client.query(
                'INSERT INTO holidays (id, name, date, type, location, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [id, name, date, type, location, created_at]
            );
            
            return createResponse(201, res.rows[0]);
        }

        if (method === 'PUT' && id) {
            const { name, date, type, location, updated_at } = JSON.parse(event.body);
            console.log(JSON.parse(event.body));
            const res = await client.query(
                'UPDATE holidays SET name=$1, date=$2, type=$3, location=$4, updated_at=$6 WHERE id=$5 RETURNING *',
                [name, date, type, location, id, updated_at]
            );
            return createResponse(200, res.rows[0]);
        }

        if (method === 'DELETE' && id) {
            console.log(id);
            await client.query('DELETE FROM holidays WHERE id=$1', [id]);
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
