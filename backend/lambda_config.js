
import pool from './db.js';

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const method = event.httpMethod || event.requestContext?.httpMethod;
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    let client;
    try {
        client = await pool.connect();

        if (method === 'GET') {
            const res = await client.query('SELECT * FROM system_config WHERE tenant_id = $1 LIMIT 1', [tenantId]);
            return createResponse(200, res.rows[0]);
        }

        if (method === 'POST') {
            const { account_id, company_name, logo_url } = JSON.parse(event.body);

            // UPSERT logic: Account ID is unchangeable once set
            const res = await client.query(
                `INSERT INTO system_config (account_id, company_name, logo_url, tenant_id) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (account_id) DO UPDATE 
                 SET company_name = EXCLUDED.company_name, logo_url = EXCLUDED.logo_url 
                 RETURNING *`,
                [account_id, company_name, logo_url, tenantId]
            );
            return createResponse(200, res.rows[0]);
        }

        return createResponse(405, { message: "Method Not Allowed" });
    } catch (err) {
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
