const cron = require("node-cron");
const { generateMonthlyRent } = require("../controllers/rentController");

// Schedule the job to run at midnight on the 1st day of every month
cron.schedule("0 0 15 * *", async () => {
  console.log("Generating monthly rent...");
  await generateMonthlyRent();
  console.log("Monthly rent generation completed.");
});

// cron.schedule("* * * * *", async () => {
//   console.log("Generating monthly rent...");
//   await generateMonthlyRent();
//   console.log("Monthly rent generation completed.");
// });
