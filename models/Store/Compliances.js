const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Compliances = sequelize.define("storeCompliances", {
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  gstin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dln: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fssaiNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Compliances;
