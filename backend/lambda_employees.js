
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
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (httpMethod === 'GET') {
            if (empId) {
                const res = await client.query('SELECT * FROM employees WHERE employee_id = $1 AND tenant_id = $2 AND is_active = TRUE', [empId, tenantId]);
                return res.rows.length ? createResponse(200, res.rows[0]) : createResponse(404, { message: "Employee not found" });
            }

            if (emailParam) {
                const res = await client.query('SELECT * FROM employees WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE', [emailParam, tenantId]);
                return res.rows.length ? createResponse(200, res.rows[0]) : createResponse(404, { message: "Employee not found with that email" });
            }

            const res = await client.query('SELECT * FROM employees WHERE tenant_id = $1 AND is_active = TRUE ORDER BY name ASC', [tenantId]);
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
                tenant_id: tenantId,
                is_active: true,
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
            console.log(JSON.parse(event.body));

            const { updated_at, ...rest } = data;
            const fields = Object.keys(rest).filter(k => k !== 'employee_id');
            const setClause = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
            const values = fields.map(k => rest[k]);

            // Add updated_at if present
            let finalQuery = `UPDATE employees SET ${setClause}`;
            let finalValues = [empId, ...values];

            if (updated_at) {
                finalQuery += `, updated_at = $${finalValues.length + 1}`;
                finalValues.push(updated_at);
            }

            finalQuery += ` WHERE employee_id = $1 AND tenant_id = '${tenantId}' RETURNING *`; // Hardcoding tenantId in WHERE or adding as param. Adding as param is cleaner but variable length. Let's use literal for simplicity or append.
            // Re-doing to append tenantId check properly.

            // Simpler approach:
            // Just update strict fields provided.
            const setClauseWithUpdate = [...fields, 'updated_at'].map((k, i) => `${k} = $${i + 2}`).join(', ');
            const valuesWithUpdate = [...values, updated_at];

            // Wait, if updated_at is missing? User said send from FE. I should expect it.

            const updateRes = await client.query(`UPDATE employees SET ${setClauseWithUpdate} WHERE employee_id = $1 AND tenant_id = $${valuesWithUpdate.length + 2} RETURNING *`, [empId, ...valuesWithUpdate, tenantId]);

            return createResponse(200, updateRes.rows[0]);
        }

        if (httpMethod === 'DELETE' && empId) {
            console.log(empId);
            // Employees usually don't have is_active in the schema block provided? 
            // Schema has `leaves_remaining`, etc. `is_active` NOT listed in schema for employees table in what I saw?
            // "employees" table schema provided: is_admin bool. NO is_active column shown in schema from Step 23.
            // Checking Step 23 schema for employees: ... is_admin bool. NO is_active.
            // User request: "for all the deletes make sure to use the 'is_active' boolean flag to update".
            // I should add Soft Delete logic assuming the column EXISTS or will exist.
            // I will assume standard requirement applies even if schema missed it, or I should verify.
            // Plan said: "User Review Required... assumes all tables have is_active". User said PROCEED.
            // So I proceed assuming it exists.

            const { updated_at } = JSON.parse(event.body || '{}');
            await client.query('UPDATE employees SET is_active = FALSE, updated_at = $2 WHERE employee_id=$1 AND tenant_id=$3', [empId, updated_at, tenantId]);
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
