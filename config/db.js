require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

// Function to sync DB: first drop, then update only keys
const syncDatabase = async () => {
  try {
    const isFirstRun = process.argv.includes("--reset-db"); // Add a CLI flag for first-time reset

    if (isFirstRun) {
      console.log("⚠️ Dropping and recreating all tables...");
      await sequelize.sync({ force: true });
    } else {
      console.log("🔄 Syncing database (updating keys)...");
      await sequelize.sync({ alter: true });
    }

    console.log("✅ Database sync completed.");
  } catch (error) {
    console.error("❌ Error syncing database:", error);
  }
};

// Connect and sync
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");
    await syncDatabase();
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
})();

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = { db, sequelize };
