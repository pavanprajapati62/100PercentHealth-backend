const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const DoctorRent = sequelize.define("doctorRent", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  gateways: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fetchedRent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = DoctorRent;
