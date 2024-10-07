const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Patient = sequelize.define("patient", {});

module.exports = Patient;
