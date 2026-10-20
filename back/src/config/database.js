const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../..", ".env") });

module.exports = {
  username: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || "condominio_viver_bem",
  host: process.env.PGHOST || "127.0.0.1",
  port: Number(process.env.PGPORT || 5433),
  syndicEmail: process.env.SYNDIC_EMAIL || "sindico@gmail.com",
  syndicPassword: process.env.SYNDIC_PASSWORD || "12345"
};
