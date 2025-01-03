const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const FrequentProducts = sequelize.define("frequentProducts", {
  IID: {
    type: DataTypes.STRING,
    references: {
      model: "products",
      key: "IID",
    },
    allowNull: false,
  },
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  }, 
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: true,
  }, 
});

module.exports = FrequentProducts;
