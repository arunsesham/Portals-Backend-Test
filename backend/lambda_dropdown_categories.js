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
                WHERE tenant_id = $1 AND is_active = TRUE
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
            const { key, created_at, updated_at } = body;

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
                    is_active,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    TRUE,
                    $3,
                    $3
                )
                `,
                [key, tenantId, created_at]
            );

            return createResponse(201, { message: 'Dropdown category created' });
        }

        /* ----------------------- PUT ----------------------- */
        // PUT /dropdown-categories/:id
        if (method === 'PUT') {
            if (!idParam) {
                return createResponse(400, { message: 'Category ID missing' });
            }

            const { key, is_active, updated_at } = body;

            await client.query(
                `
                UPDATE dropdown_categories
                SET
                    key = COALESCE($1, key),
                    is_active = COALESCE($2, is_active),
                    updated_at = $4
                WHERE id = $3 AND tenant_id = $5
                `,
                [key, is_active, idParam, updated_at, tenantId]
            );

            return createResponse(200, { message: 'Dropdown category updated' });
        }

        /* ----------------------- DELETE ----------------------- */
        // DELETE /dropdown-categories/:id (soft delete)
        if (method === 'DELETE') {
            if (!idParam) {
                return createResponse(400, { message: 'Category ID missing' });
            }

            const { updated_at } = body;

            await client.query(
                `
                UPDATE dropdown_categories
                SET is_active = FALSE,
                    updated_at = $2
                WHERE id = $1 AND tenant_id = $3
                `,
                [idParam, updated_at, tenantId]
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
