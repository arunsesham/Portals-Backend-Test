
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
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    const empId = event.pathParameters?.id;
    const emailParam = event.queryStringParameters?.email;

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'GET') {
            if (empId) {
                const res = await client.query('SELECT * FROM employees WHERE employee_id = $1', [empId]);
                return res.rows.length ? createResponse(200, res.rows[0]) : createResponse(404, { message: "Employee not found" });
            }
            
            if (emailParam) {
                const res = await client.query('SELECT * FROM employees WHERE email = $1', [emailParam]);
                return res.rows.length ? createResponse(200, res.rows[0]) : createResponse(404, { message: "Employee not found with that email" });
            }

            const res = await client.query('SELECT * FROM employees ORDER BY name ASC');
            return createResponse(200, res.rows);
        }

        if (httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            const { header, ...filteredData } = data;
            const countResult = await client.query(
                'SELECT COUNT(*)::int AS count FROM employees'
            );
            const nextEmployeeId = countResult.rows[0].count + 1;
            console.log(nextEmployeeId);
            const finalData = {
                employee_id: nextEmployeeId,
                ...filteredData
            };
            const columns = Object.keys(finalData).join(', ');
            const placeholders = Object.keys(finalData)
                .map((_, i) => `$${i + 1}`)
                .join(', ');
            const values = Object.values(finalData);
            console.log(
                `INSERT INTO employees (${columns}) VALUES (${placeholders}) RETURNING *`,
                values
            );
            const res = await client.query(
                `INSERT INTO employees (${columns}) VALUES (${placeholders}) RETURNING *`,
                values
            );
            return createResponse(201, res.rows[0]);
        }


        if (httpMethod === 'PUT' && empId) {
            const data = JSON.parse(event.body);
            const fields = Object.keys(data).filter(k => k !== 'employee_id');
            const setClause = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
            const values = fields.map(k => data[k]);
            const res = await client.query(`UPDATE employees SET ${setClause} WHERE employee_id = $1 RETURNING *`, [empId, ...values]);
            return createResponse(200, res.rows[0]);
        }

        if (httpMethod === 'DELETE' && empId) {
            console.log(empId);
            await client.query('DELETE FROM employees WHERE employee_id=$1', [empId]);
            return createResponse(200, { success: true });
        }

        return createResponse(405, { message: "Method Not Allowed" });

    } catch (err) {
        console.error(err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
