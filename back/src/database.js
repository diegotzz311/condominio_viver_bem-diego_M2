const { Pool } = require("pg");
const config = require("./config/database");

if (!config.password) {
  throw new Error("Configure a variável de ambiente PGPASSWORD para conectar ao PostgreSQL.");
}

const pool = new Pool({
  user: config.username,
  password: config.password,
  database: config.database,
  host: config.host,
  port: config.port
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      apartment_number VARCHAR(30) NOT NULL,
      event_date DATE NOT NULL,
      event_time TIME NOT NULL,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS event_time TIME");
  await pool.query("UPDATE reservations SET event_time = TIME '00:00' WHERE event_time IS NULL");
  await pool.query("ALTER TABLE reservations ALTER COLUMN event_time SET NOT NULL");
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reservations_event_slot_unique
    ON reservations (event_date, event_time)
  `);
}

module.exports = { pool, initializeDatabase };
