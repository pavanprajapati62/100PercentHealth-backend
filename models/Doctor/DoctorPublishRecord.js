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
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fetchedRent: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  paidRent: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  trxId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = DoctorPublishRecord;
