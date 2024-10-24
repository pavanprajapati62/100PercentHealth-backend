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
      "Ointment",
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
});

Product.beforeCreate(async (product) => {
  // const productCount = await Product.count();
  // const newIID = `IID${String(productCount + 1).padStart(3, "0")}`;

  const lastproduct = await Product.findOne({
    order: [['IID', 'DESC']],
    attributes: ['IID'],
  });

  let newIID;

  if (lastproduct && lastproduct.IID) {
    const lastOIDNumber = parseInt(lastproduct.IID.slice(3), 10);
    newIID = `IID${String(lastOIDNumber + 1).padStart(3, '0')}`;
  } else {
    // First time creation, start with SID001
    newIID = 'IID001';
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
