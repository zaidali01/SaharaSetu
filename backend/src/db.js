const { Pool } = require('pg');
require('dotenv').config();

// Supabase (and most managed Postgres) require TLS. Default to on, allow
// explicit opt-out for local dev, or force on via DATABASE_SSL=true.
const useSsl = process.env.DATABASE_SSL
  ? process.env.DATABASE_SSL === 'true'
  : process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

module.exports = { pool };
