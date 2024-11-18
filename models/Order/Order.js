const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const PatientDetails = require("./PatientDetails");
const Billing = require("./Billing");
const OrderProduct = require("./Product");
const PatientAddress = require("./Adress");
const Invoice = require("./Invoice");
const DoctorOrderMargins = require("../Doctor/DoctorOrderMargins");
const PendingDoctorMargin = require("../Rent/PendingDoctorMargin");

const Order = sequelize.define("order", {
  OID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    primaryKey: true,
  },
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  isClinic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isCollect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAddress: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  payment: {
    type: DataTypes.ENUM("cash", "card", "upi"),
    allowNull: true,
  },
  prescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  orderStatus: {
    type: DataTypes.ENUM("Accepted", "Packed", "Collected", "Dispatched", "Delivered", "Cancelled"),
    allowNull: true,
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPacked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isCollected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDispatched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isCancelled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  cancelReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SID: {
    type: DataTypes.STRING,
    references: {
      model: "stores",
      key: "SID",
    },
    allowNull: false,
  },
  PID: {
    type: DataTypes.STRING,
    references: {
      model: "patientDetails",
      key: "PID",
    },
    allowNull: true,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  acceptTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  packedTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  collectedTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dispatchTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  QP: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  QD: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ET: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  S1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  S2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isOrderEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  addressType: {
    type: DataTypes.ENUM("home", "work", "other"),
    allowNull: true,
  },
  premisesNoFloor: {
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
  pincode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneNumber2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  balanceDosagePercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  balanceDosageTime: {
    type: DataTypes.DATE,
    allowNull: true,
  }
});

Order.beforeCreate(async (order) => {
  const lastOrder = await Order.findOne({
    order: [['OID', 'DESC']],
    attributes: ['OID'],
  });

  let newOID;

  if (lastOrder && lastOrder.OID) {
    const lastOIDNumber = parseInt(lastOrder.OID.slice(3), 10);
    newOID = `OID${String(lastOIDNumber + 1).padStart(3, '0')}`;
  } else {
    // First time creation, start with OID001
    newOID = 'OID001';
  }

  order.OID = newOID;
});

Order.hasOne(Billing, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});

Order.hasOne(Invoice, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});

Order.hasMany(OrderProduct, {
  foreignKey: "OID",
  sourceKey: "OID",
  onDelete: "CASCADE",
});
OrderProduct.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });

Billing.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });

Invoice.belongsTo(Order, { foreignKey: "OID", targetKey: "OID" });

Order.hasOne(DoctorOrderMargins, { foreignKey: 'OID', sourceKey: 'OID' });
DoctorOrderMargins.belongsTo(Order, { foreignKey: 'OID', targetKey: 'OID' });

Order.hasOne(PendingDoctorMargin, { foreignKey: 'OID', sourceKey: 'OID' });
PendingDoctorMargin.belongsTo(Order, { foreignKey: 'OID', targetKey: 'OID' });

PatientDetails.hasMany(Order, { foreignKey: "PID", sourceKey: "PID" });
Order.belongsTo(PatientDetails, {
  foreignKey: "PID",
  targetKey: "PID",
  onDelete: "CASCADE",
});

module.exports = Order;
