// models/DoctorSequence.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const DoctorSequence = sequelize.define("doctorSequence", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  lastId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = DoctorSequence;
