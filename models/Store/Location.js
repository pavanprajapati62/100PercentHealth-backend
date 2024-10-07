const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Location = sequelize.define("location", {
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  googleMapUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Location;
