const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const StoreBillingDetail = sequelize.define('storeBillingDetail', {
  SID: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: "stores",
      key: 'SID',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  smallCartFee: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  handlingFee: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  deliveryChargesSameState: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  deliveryChargesOtherState: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  noDiscount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  isDiscount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = StoreBillingDetail;
