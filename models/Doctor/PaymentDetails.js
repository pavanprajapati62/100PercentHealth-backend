const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const PaymentDetails = sequelize.define("paymentDetails", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  bankAccountNumber: {
    type: DataTypes.STRING,
  },
  accountName: {
    type: DataTypes.STRING,
  },
  bankName: {
    type: DataTypes.STRING,
  },
  ifscName: {
    type: DataTypes.STRING,
  },
  upiId: {
    type: DataTypes.STRING,
  },
});

module.exports = PaymentDetails;
