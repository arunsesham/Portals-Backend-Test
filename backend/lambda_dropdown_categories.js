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
    let client;

    const method = event.httpMethod;
    const tenantId = '79c00000-0000-0000-0000-000000000001'; // same as others

    const idParam = event.pathParameters?.id;

    try {
        client = await pool.connect();

        /* ----------------------- GET ----------------------- */
        // GET /dropdown-categories
        if (method === 'GET') {
            const result = await client.query(
                `
                SELECT id, key, is_active
                FROM dropdown_categories
                WHERE tenant_id = $1
                ORDER BY key
                `,
                [tenantId]
            );

            return createResponse(200, result.rows);
        }

        const body = JSON.parse(event.body || '{}');

        /* ----------------------- POST ----------------------- */
        // POST /dropdown-categories
        if (method === 'POST') {
            const { key } = body;

            if (!key) {
                return createResponse(400, { message: 'Category key is required' });
            }

            // prevent duplicates
            const existing = await client.query(
                `
                SELECT id FROM dropdown_categories
                WHERE key = $1 AND tenant_id = $2
                `,
                [key, tenantId]
            );

            if (existing.rows.length) {
                return createResponse(409, { message: 'Category already exists' });
            }

            await client.query(
                `
                INSERT INTO dropdown_categories (
                    id,
                    key,
                    tenant_id,
                    is_active
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    TRUE
                )
                `,
                [key, tenantId]
            );

            return createResponse(201, { message: 'Dropdown category created' });
        }

        /* ----------------------- PUT ----------------------- */
        // PUT /dropdown-categories/:id
        if (method === 'PUT') {
            if (!idParam) {
                return createResponse(400, { message: 'Category ID missing' });
            }

            const { key, is_active } = body;

            await client.query(
                `
                UPDATE dropdown_categories
                SET
                    key = COALESCE($1, key),
                    is_active = COALESCE($2, is_active),
                    updated_at = NOW()
                WHERE id = $3
                `,
                [key, is_active, idParam]
            );

            return createResponse(200, { message: 'Dropdown category updated' });
        }

        /* ----------------------- DELETE ----------------------- */
        // DELETE /dropdown-categories/:id (soft delete)
        if (method === 'DELETE') {
            if (!idParam) {
                return createResponse(400, { message: 'Category ID missing' });
            }

            await client.query(
                `
                UPDATE dropdown_categories
                SET is_active = FALSE,
                    updated_at = NOW()
                WHERE id = $1
                `,
                [idParam]
            );

            return createResponse(200, { message: 'Dropdown category deleted' });
        }

        return createResponse(405, { message: 'Method not allowed' });

    } catch (err) {
        console.error(err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
