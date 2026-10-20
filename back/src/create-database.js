const { Client } = require("pg");
const config = require("./config/database");

async function createDatabase() {
  if (!config.password) {
    throw new Error("Configure a variável de ambiente PGPASSWORD para conectar ao PostgreSQL.");
  }

  const client = new Client({
    user: config.username,
    password: config.password,
    database: "postgres",
    host: config.host,
    port: config.port
  });

  await client.connect();
  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [config.database]
    );
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${config.database.replace(/"/g, '""')}"`);
      console.log(`Database "${config.database}" created.`);
    } else {
      console.log(`Database "${config.database}" already exists.`);
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error("Could not create or check the PostgreSQL database:", error.message);
  process.exitCode = 1;
});
