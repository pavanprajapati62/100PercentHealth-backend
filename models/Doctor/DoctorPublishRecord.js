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
  FID: {
    type: DataTypes.STRING,
    references: {
      model: "doctorRents",
      key: "FID",
    },
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gateways: {
    type: DataTypes.INTEGER,
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
    type: DataTypes.DATE,
    allowNull: true,
  },
  period: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fetchedRent: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paidRent: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trxId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isPublish: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  detail: {
    type: DataTypes.JSONB, 
    defaultValue: [],
    allowNull: true,
  },
});

module.exports = DoctorPublishRecord;
