const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Admin = sequelize.define(
  "admin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "admin", // Default role
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Admin;
