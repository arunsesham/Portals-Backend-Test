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
    const tenantId = '79c00000-0000-0000-0000-000000000001';

    const keyParam = event.pathParameters?.key;
    const idParam = event.pathParameters?.id;

    if (!tenantId) {
        return createResponse(400, { message: 'Tenant ID missing' });
    }

    try {
        client = await pool.connect();

        if (method === 'GET') {
            if (keyParam) {
                // GET /dropdowns/:key
                const result = await client.query(
                    `
                    SELECT o.id, o.value, o.label
                    FROM dropdown_options o
                    JOIN dropdown_categories c ON c.id = o.category_id
                    WHERE c.key = $1
                      AND c.tenant_id = $2
                      AND c.is_active = TRUE
                      AND o.is_active = TRUE
                    ORDER BY o.sort_order
                    `,
                    [keyParam, tenantId]
                );

                return createResponse(200, result.rows);
            }

            // GET /dropdowns (all)
            const result = await client.query(
                `
                SELECT
                    c.key,
                    o.id,
                    o.value,
                    o.label
                FROM dropdown_categories c
                JOIN dropdown_options o ON o.category_id = c.id
                WHERE c.tenant_id = $1
                  AND c.is_active = TRUE
                  AND o.is_active = TRUE
                ORDER BY c.key, o.sort_order
                `,
                [tenantId]
            );

            return createResponse(200, result.rows);
        }

        const body = JSON.parse(event.body || '{}');
        // POST /dropdowns
        if (method === 'POST') {
            const { categoryKey, value, label, sortOrder = 0, created_at } = body;

            if (!categoryKey || !value || !label) {
                return createResponse(400, { message: 'Missing fields' });
            }

            const category = await client.query(
                `
                SELECT id FROM dropdown_categories
                WHERE key = $1 AND tenant_id = $2 AND is_active = TRUE
                `,
                [categoryKey, tenantId]
            );

            if (!category.rows.length) {
                return createResponse(404, { message: 'Category not found' });
            }

            await client.query(
                `
                INSERT INTO dropdown_options (
                    id,
                    category_id,
                    value,
                    label,
                    sort_order,
                    created_at,
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $5
                )
                `,
                [category.rows[0].id, value, label, sortOrder, created_at]
            );

            return createResponse(201, { message: 'Dropdown option created' });
        }

        // PUT /dropdowns/:id
        if (method === 'PUT') {
            if (!idParam) {
                return createResponse(400, { message: 'Option ID missing' });
            }

            const { value, label, sortOrder, is_active, updated_at } = body;

            await client.query(
                `
                UPDATE dropdown_options
                SET
                    value = COALESCE($1, value),
                    label = COALESCE($2, label),
                    sort_order = COALESCE($3, sort_order),
                    is_active = COALESCE($4, is_active),
                    updated_at = $5
                WHERE id = $6
                `,
                [value, label, sortOrder, is_active, updated_at, idParam]
            );

            return createResponse(200, { message: 'Dropdown option updated' });
        }

        // DELETE /dropdowns/:id (soft delete)
        if (method === 'DELETE') {
            if (!idParam) {
                return createResponse(400, { message: 'Option ID missing' });
            }
            const { updated_at } = body;

            await client.query(
                `
                UPDATE dropdown_options
                SET is_active = FALSE,
                    updated_at = $2
                WHERE id = $1
                `,
                [idParam, updated_at]
            );

            return createResponse(200, { message: 'Dropdown option deleted' });
        }

        return createResponse(405, { message: 'Method not allowed' });

    } catch (err) {
        console.error(err);
        return createResponse(500, { error: err.message });
    } finally {
        if (client) client.release();
    }
};
