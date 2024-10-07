const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const StoreProduct = require("./StoreProduct");

const Product = sequelize.define("product", {
  IID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    primaryKey: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      "Tablet",
      "Capsules",
      "Syrup",
      "Drops",
      "Powder",
      "Cream",
      "Oinment",
      "Other"
    ),
    allowNull: false,
  },
  drugs: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Stores multiple drug names
    allowNull: false,
  },
  storeQty: {
    type: DataTypes.JSONB, // Stores store quantity as an array of objects
    defaultValue: [],
  },
  marginPercentage: {
    type: DataTypes.DECIMAL(5, 2), // For margin percentage
    allowNull: true,
  },
  AM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  BM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  CM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  DM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  EM: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  pricing: {
    type: DataTypes.JSONB, // Stores pricing information
    allowNull: false,
    defaultValue: {
      mrp: 0,
      gst: 0,
      discount: 0,
    },
  },
});

Product.hasMany(StoreProduct, { foreignKey: "IID", sourceKey: "IID" });
StoreProduct.belongsTo(Product, { foreignKey: "IID", targetKey: "IID" });

module.exports = Product;
