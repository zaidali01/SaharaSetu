const fs = require('fs');
const path = require('path');
const { pool } = require('./src/db');

async function initializeDatabase() {
  try {
    // Check if the users table exists as a proxy for initialization
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const isInitialized = res.rows[0].exists;

    if (!isInitialized) {
      console.log('[DB INIT] Tables not found. Running 001_init.sql...');
      const sqlPath = path.join(__dirname, 'migrations', '001_init.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await pool.query(sql);
      console.log('[DB INIT] Successfully initialized database schema and seed data.');
    } else {
      console.log('[DB INIT] Database already initialized. Skipping migration.');
    }
  } catch (err) {
    console.error('[DB INIT] Failed to initialize database:', err.message);
    // Don't crash the server, just log the error so fallback works
  }
}

module.exports = { initializeDatabase };
