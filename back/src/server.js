const app = require("./app");
const { initializeDatabase, pool } = require("./database");

initializeDatabase()
  .then(() => {
    const port = Number(process.env.API_PORT || 5432);
    app.listen(port, () => console.log(`Server is on port ${port}`));
  })
  .catch(async (error) => {
    console.error("Could not initialize the database:", error.message);
    await pool.end();
    process.exitCode = 1;
  });
