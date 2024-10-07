const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const AccountCategory = sequelize.define("accountCategory", {
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
});

module.exports = AccountCategory;
