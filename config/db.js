require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false, // Allow self-signed certificates
    //   },
    //   connectTimeout: 60000, // Increase connection timeout (60s)
    // },
    pool: {
      max: 10, // Allow up to 10 concurrent connections
      min: 2, // Keep at least 2 connections open
      acquire: 60000, // Wait up to 60s for a connection
      idle: 20000, // Close idle connections after 20s
    },
  }
);

// Function to sync database (update tables without dropping data)
const syncDatabase = async () => {
  try {
    console.log("🔄 Syncing database...");
     // sequelize.sync({ alter: true }); // Keeps existing data and updates schema
    console.log("✅ Database sync completed.");
  } catch (error) {
    console.error("❌ Error syncing database:", error);
    process.exit(1); // Exit process if sync fails
  }
};

// Function to connect with retry mechanism
const connectDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log("✅ Database connection established.");
      await syncDatabase(); // Sync database after connection
      console.log("🚀 Server is running on port 5000.");
      return;
    } catch (error) {
      console.error(`❌ Database connection failed (Attempt ${i + 1}/${retries}). Retrying in ${delay / 1000}s...`);
      if (i === retries - 1) {
        console.error("❌ Maximum retries reached. Exiting.");
        process.exit(1); // Exit if all retries fail
      }
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
    }
  }
};

// Start the database connection
connectDatabase();

// Export database instance
const db = { Sequelize, sequelize };
module.exports = { db, sequelize };
