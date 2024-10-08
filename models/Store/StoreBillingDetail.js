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
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
    }
  },
  handlingFee: {
    type: DataTypes.JSON, 
    defaultValue: {
      charges: "",
      applyBelow: "",
    }
  },
  deliveryChargesSameState: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
    }
  },
  deliveryChargesOtherState: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
    }
  },
  noDiscount: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      percentage: "",
      applyBelow: "",
    }
  },
  isDiscount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = StoreBillingDetail;
