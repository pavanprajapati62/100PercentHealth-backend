const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoute");
const db = require("./config/db");

const app = express();

app.use(bodyParser.json());
app.use(cors());

//synchronizing the database and forcing it to false so we dont lose data
db.sequelize.sync({ alter: true }).then(() => {
  console.log("db has been re sync");
});

app.use("/api/auth", authRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes)
// app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log("db has been synchronized with any model changes.");
});
