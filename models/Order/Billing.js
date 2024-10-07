const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Billing = sequelize.define("billing", {
  OID: {
    type: DataTypes.STRING,
    references: {
      model: "orders",
      key: "OID",
    },
    allowNull: false,
  },
  subTotal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalDiscount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  handlingFee: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  smallCartFee: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryCharges: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gst: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payableAmount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Billing;
