const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const PatientDetails = require("./PatientDetails");
const Billing = require("./Billing");
const OrderProduct = require("./Product");
const PatientAddress = require("./Adress");
const Invoice = require("./Invoice");

const Order = sequelize.define("order", {
  OID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    primaryKey: true,
  },
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  isClinic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isCollect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAddress: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  payment: {
    type: DataTypes.ENUM("cash", "card", "upi"),
    allowNull: true,
  },
  prescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  orderStatus: {
    type: DataTypes.ENUM("Accepted", "Packed", "Dispatched", "Delivered"),
    allowNull: true,
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPacked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDispatched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isCancelled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  cancelReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
});

Order.beforeCreate(async (order) => {
  const orderCount = await Order.count();
  const newOID = `OID${String(orderCount + 1).padStart(3, "0")}`;

  order.OID = newOID;
});

Order.hasOne(PatientDetails, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});
Order.hasOne(Billing, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});
Order.hasOne(PatientAddress, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});
Order.hasOne(Invoice, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});

Order.hasMany(OrderProduct, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});
OrderProduct.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });

PatientDetails.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });
Billing.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });
PatientAddress.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });
Invoice.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });

module.exports = Order;
