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
    allowNull: false,
  },
  dln: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fssaiNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Compliances;
