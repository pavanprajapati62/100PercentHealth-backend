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
  applyAll: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  smallCartFee: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
      enable: false,
    }
  },
  handlingFee: {
    type: DataTypes.JSON, 
    defaultValue: {
      charges: "",
      applyBelow: "",
      enable: false,
    }
  },
  deliveryChargesSameState: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
      enable: false,
    }
  },
  deliveryChargesOtherState: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
      enable: false,
    }
  },
  deliveryChargesSameCity: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      charges: "",
      applyBelow: "",
      enable: false,
    }
  },
  noDiscount: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: {
      percentage: "",
      applyBelow: "",
      enable: false,
    }
  },
  isDiscount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = StoreBillingDetail;
