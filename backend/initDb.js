const fs = require('fs');
const path = require('path');
const { pool } = require('./src/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function initializeDatabase() {
  try {
    await ensureMigrationsTable();

    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map(r => r.filename));

    // Apply in filename order; each file runs in its own transaction so a
    // failure in one does not leave a half-applied schema.
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[DB INIT] ${file} already applied. Skipping.`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[DB INIT] Applied ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[DB INIT] ${file} failed, rolled back: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    if (count === 0) {
      console.log('[DB INIT] Database up to date. No migrations to run.');
    } else {
      console.log(`[DB INIT] Applied ${count} migration(s).`);
    }
  } catch (err) {
    // Don't crash the server — the API layer has offline fallbacks.
    console.error('[DB INIT] Failed to initialize database:', err.message);
  }
}

module.exports = { initializeDatabase };
