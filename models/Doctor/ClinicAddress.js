const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const ClinicAddress = sequelize.define("clinicAddress", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  premisesNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  premisesName: {
    type: DataTypes.STRING,
  },
  landmark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  areaRoad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clinicContactNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  googleMapUrl: {
    type: DataTypes.STRING,
  },
  about: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = ClinicAddress;
