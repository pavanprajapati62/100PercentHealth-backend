const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const Compliances = require("./Compliances");
const Address = require("./Address");
const Location = require("./Location");
const Contact = require("./Contact");
const bcrypt = require("bcryptjs");
const Order = require("../Order/Order");
const StoreBillingDetail = require("./StoreBillingDetail");

const Store = sequelize.define("store", {
  SID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "store",
  },
  currentStoreStatus: {
    type: DataTypes.ENUM("ACTIVE", "AWAY", "CLOSED"),
    allowNull: true,
  },
});

Store.beforeCreate(async (store) => {
  const storeCount = await Store.count();
  const newSID = `SID${String(storeCount + 1).padStart(3, "0")}`;

  const hashedPin = await bcrypt.hash(store.pin, 10);
  store.pin = hashedPin;

  store.SID = newSID;
});

Store.hasOne(Compliances, { foreignKey: "SID", sourceKey: "SID" });
Store.hasOne(Address, { foreignKey: "SID", sourceKey: "SID" });
Store.hasOne(Location, { foreignKey: "SID", sourceKey: "SID" });
Store.hasOne(Contact, { foreignKey: "SID", sourceKey: "SID" });
Store.hasMany(Order, { foreignKey: "SID", sourceKey: "SID" });

Compliances.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" });
Address.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" });
Location.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" });
Contact.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" });
Order.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" });

Store.hasOne(StoreBillingDetail, { foreignKey: 'SID', sourceKey: 'SID' });
StoreBillingDetail.belongsTo(Store, { foreignKey: 'SID', targetKey: 'SID' });

module.exports = Store;