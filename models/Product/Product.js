const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const StoreProduct = require("./StoreProduct");
const ProductMargin = require("./ProductMargin");
const FrequentProducts = require("../Doctor/FrequentProducts");

const Product = sequelize.define("product", {
  IID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    collate: 'utf8mb4_unicode_ci',
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  units: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: false,
  },
  storeQty: {
    type: DataTypes.JSONB, 
    defaultValue: [],
  },
  pricing: {
    type: DataTypes.JSONB, 
    allowNull: false,
    defaultValue: {
      mrp: 0,
      gst: 0,
      discount: 0,
    },
  },
  productStock: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isProductDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Product.beforeCreate(async (product) => {
  const lastProduct = await Product.findOne({
    order: [['IID', 'DESC']],
    attributes: ['IID'],
  });

  let newIID;

  if (lastProduct && lastProduct.IID) {
    const lastIIDNumber = parseInt(lastProduct.IID.slice(1), 10); 
    newIID = `I${String(lastIIDNumber + 1).padStart(5, '0')}`; 
  } else {
    newIID = 'I00001';
  }

  product.IID = newIID;
});


Product.hasOne(ProductMargin, { foreignKey: "IID", sourceKey: "IID" });
ProductMargin.belongsTo(Product, { foreignKey: "IID", targetKey: "IID" });

Product.hasMany(StoreProduct, { foreignKey: "IID", sourceKey: "IID" });
StoreProduct.belongsTo(Product, { foreignKey: "IID", targetKey: "IID" });

Product.hasMany(FrequentProducts, { foreignKey: "IID", sourceKey: "IID" });
FrequentProducts.belongsTo(Product, { foreignKey: "IID", targetKey: "IID" });

module.exports = Product;
