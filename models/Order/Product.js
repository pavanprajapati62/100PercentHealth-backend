const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const OrderProduct = sequelize.define("orderProduct", {
  OID: {
    type: DataTypes.STRING,
    references: {
      model: "orders",
      key: "OID",
    },
    allowNull: false,
  },
  IID: {
    type: DataTypes.STRING,
    references: {
      model: "products",
      key: "IID",
    },
    allowNull: true,
  },
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  units: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rxDays: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  orderQty: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rxUnits: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  orderUnits: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  balanceUnits: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dosageNote: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mrp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gst: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  netAmt: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM(
      "Tablet",
      "Capsules",
      "Syrup",
      "Drops",
      "Powder",
      "Cream",
      "Oinment",
      "Other"
    ),
    allowNull: false,
  },
  morningTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  midDay: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  eveningTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  night: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  takenTime: {
    type: DataTypes.ENUM("A/F", "B/F", "X"),
    allowNull: false,
  },
  extra: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = OrderProduct;
