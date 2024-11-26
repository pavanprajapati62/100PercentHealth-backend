const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const PersonalInfo = sequelize.define("personalInfo", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clinicName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tagline: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  qualificationSpecialisation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  operatorName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  managerName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  about1: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 650],
    },
    allowNull: true,
  },
  about2: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 650],
    },
    allowNull: true,
  },
});

module.exports = PersonalInfo;
