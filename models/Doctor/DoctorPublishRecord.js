const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const Store = require("../Store/Store");

const DoctorPublishRecord = sequelize.define("doctorPublishRecord", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gateways: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  trxType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currentDoctorStatus: {
    type: DataTypes.ENUM("ACTIVE", "AWAY", "CLOSED"),
    allowNull: true,
  },
  is_pin_b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = DoctorPublishRecord;
