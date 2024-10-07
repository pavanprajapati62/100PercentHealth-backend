const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Contact = sequelize.define("contact", {
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  contactNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Contact;
