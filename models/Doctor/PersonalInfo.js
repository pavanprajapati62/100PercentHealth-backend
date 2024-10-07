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
  },
  qualificationSpecialisation: {
    type: DataTypes.STRING,
  },
  experience: {
    type: DataTypes.INTEGER,
  },
  operatorName: {
    type: DataTypes.STRING,
  },
  managerName: {
    type: DataTypes.STRING,
  },
  about1: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 120],
    },
  },
  about2: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 120],
    },
  },
});

module.exports = PersonalInfo;
