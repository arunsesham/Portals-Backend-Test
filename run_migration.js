import pool from './backend/db.js';
import fs from 'fs';
import path from 'path';

const applyMigration = async () => {
    console.log("Applying Migration...");
    const migrationPath = path.resolve('backend/migrations/01_policy_versioning.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log("Migration Applied Successfully.");
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error("Migration Failed:", e);
    } finally {
        if (client) client.release();
        process.exit();
    }
};

applyMigration();
