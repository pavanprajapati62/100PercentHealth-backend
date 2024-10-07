const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Address = sequelize.define("address", {
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  premisesNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  premisesName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  landmark: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  areaRoad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Address;
