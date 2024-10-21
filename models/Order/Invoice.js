const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Invoice = sequelize.define("invoice", {
  IVID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    primaryKey: true,
  },
  OID: {
    type: DataTypes.STRING,
    references: {
      model: "orders",
      key: "OID",
    },
    allowNull: false,
  },
  invoiceNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoiceAmount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Invoice.beforeCreate(async (invoice) => {
//   const invoiceCount = await Invoice.count();
//   const newIVID = `IVID${String(invoiceCount + 1).padStart(3, "0")}`;

//   invoice.invoiceNo = newIVID;
// });

module.exports = Invoice;
