const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const StoreProduct = sequelize.define("storeProduct", {
  IID: {
    type: DataTypes.STRING,
    references: {
      model: "products",
      key: "IID",
    },
    allowNull: false,
  },
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  storeStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  units: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = StoreProduct;
