const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Compliances = sequelize.define("compliances", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Compliances;
