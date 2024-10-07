const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const EmailInfo = sequelize.define("emailInfo", {
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  doctorEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  clinicEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
    },
  },
});

module.exports = EmailInfo;
