const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const PendingDoctorMargin = sequelize.define("pendingDoctorMargin", {
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

module.exports = PendingDoctorMargin;
