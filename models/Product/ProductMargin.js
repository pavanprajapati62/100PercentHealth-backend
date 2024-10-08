const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const ProductMargin = sequelize.define("productMargin", {
  IID: {
    type: DataTypes.STRING,
    references: {
      model: "products",
      key: "IID",
    },
    allowNull: false,
  },
  category_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_b: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_c: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_d: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_e: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = ProductMargin;
