const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const PatientAddress = sequelize.define("patientAddress", {
  PID: {
    type: DataTypes.STRING,
    references: {
      model: "patientDetails",
      key: "PID",
    },
    allowNull: false,
  },
  // OID: {
  //   type: DataTypes.STRING,
  //   references: {
  //     model: "orders",
  //     key: "OID",
  //   },
  //   allowNull: false,
  // },
  addressType: {
    type: DataTypes.ENUM("home", "work", "other"),
    allowNull: true,
  },
  premisesNoFloor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  premisesName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  landmark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  areaRoad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = PatientAddress;
