
import pg from 'pg';
const { Pool } = pg;

// Global database configuration using provided Aiven credentials
const dbConfig = {
    host: process.env.DB_HOST || 'pg-2b0a09d7-cherasaravenkatesh-c2ae.k.aivencloud.com',
    port: parseInt(process.env.DB_PORT || '10192'),
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_nzzJepOjEUPzbdOGlmc',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { 
        rejectUnauthorized: false // Required for Aiven PostgreSQL connections
    },
    timezone: 'UTC'
};

const pool = new Pool(dbConfig);

export default pool;
