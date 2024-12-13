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
  paymentType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Invoice.beforeCreate(async (invoice) => {
  const lastInvoice = await Invoice.findOne({
    order: [["IVID", "DESC"]],
    attributes: ["IVID"],
  });

  let newIVID;

  if (lastInvoice && lastInvoice.IVID) {
    const lastIVIDNumber = parseInt(lastInvoice.IVID.slice(4), 10);
    newIVID = `IVID${String(lastIVIDNumber + 1).padStart(3, "0")}`;
  } else {
    newIVID = 'IVID001';
  }

  invoice.IVID = newIVID;
});

module.exports = Invoice;
