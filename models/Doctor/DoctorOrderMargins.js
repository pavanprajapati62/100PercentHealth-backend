const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const DoctorOrderMargins = sequelize.define("doctorOrderMargin", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  OID: {
    type: DataTypes.STRING,
    references: {
      model: "orders",
      key: "OID",
    },
    allowNull: false,
  },
  marginPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
});

module.exports = DoctorOrderMargins;
