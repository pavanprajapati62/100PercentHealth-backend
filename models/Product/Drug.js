const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Drug = sequelize.define("drug", {
  drugName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Drug;