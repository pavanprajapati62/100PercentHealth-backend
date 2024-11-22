const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const Compliances = require("./Compliances");
const AccountCategory = require("./AccountCategory");
const PersonalInfo = require("./PersonalInfo");
const ClinicAddress = require("./ClinicAddress");
const EmailInfo = require("./EmailInfo");
const PaymentDetails = require("./PaymentDetails");
const bcrypt = require("bcryptjs");
const Store = require("../Store/Store");
const PatientDetails = require("../Order/PatientDetails");
const Order = require("../Order/Order");
const FrequentProducts = require("./FrequentProducts");
const DoctorOrderMargins = require("./DoctorOrderMargins");
const DoctorRent = require("../Rent/DoctorRent");
const jwt = require("jsonwebtoken");

const Doctor = sequelize.define("doctor", {
  DID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    // unique: true,
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pinB: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "doctor",
  },
  SID: {
    type: DataTypes.STRING,
    references: {
      model: Store,
      key: "SID",
    },
    allowNull: true,
  },
  currentDoctorStatus: {
    type: DataTypes.ENUM("ACTIVE", "AWAY", "CLOSED"),
    allowNull: true,
    defaultValue: "CLOSED",
  },
  is_pin_b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Before creating a doctor, generate a unique DID and hash the pin
Doctor.beforeCreate(async (doctor) => {
  // const doctorCount = await Doctor.count();
  // const newDID = `DID${String(doctorCount + 1).padStart(3, "0")}`;
  const lastDoctor = await Doctor.findOne({
    order: [['DID', 'DESC']],
    attributes: ['DID'],
  });

  let newDID;

  if (lastDoctor && lastDoctor.DID) {
    const lastDIDNumber = parseInt(lastDoctor.DID.slice(3), 10);
    newDID = `DID${String(lastDIDNumber + 1).padStart(3, '0')}`;
  } else {
    // First time creation, start with DID001
    newDID = 'DID001';
  }

  const hashedPin = jwt.sign({ pin: doctor.pin }, process.env.JWT_SECRET);
  const hashedPinB = jwt.sign({ pinB: doctor.pinB }, process.env.JWT_SECRET);
  doctor.pin = hashedPin;
  doctor.pinB = hashedPinB;

  doctor.DID = newDID;
});

Doctor.hasOne(Compliances, { foreignKey: "DID", sourceKey: "DID" });
Doctor.hasOne(AccountCategory, { foreignKey: "DID", sourceKey: "DID" });
Doctor.hasOne(PersonalInfo, { foreignKey: "DID", sourceKey: "DID" });
Doctor.hasOne(ClinicAddress, { foreignKey: "DID", sourceKey: "DID" });
Doctor.hasOne(EmailInfo, { foreignKey: "DID", sourceKey: "DID" });
Doctor.hasOne(PaymentDetails, { foreignKey: "DID", sourceKey: "DID" });

Doctor.belongsTo(Store, { foreignKey: "SID", targetKey: "SID" }); // A doctor belongs to a store
Store.hasMany(Doctor, { foreignKey: "SID", sourceKey: "SID" }); // A store has many doctors

PatientDetails.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
Doctor.hasMany(PatientDetails, { foreignKey: "DID", sourceKey: "DID" });

Compliances.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
AccountCategory.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
PersonalInfo.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
ClinicAddress.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
EmailInfo.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });
PaymentDetails.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });

Doctor.hasMany(Order, { foreignKey: "DID", sourceKey: "DID" });
Order.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });

Doctor.hasMany(FrequentProducts, { foreignKey: "DID", sourceKey: "DID" });
FrequentProducts.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });

Doctor.hasMany(DoctorOrderMargins, { foreignKey: "DID", sourceKey: "DID" });
DoctorOrderMargins.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });

Doctor.hasMany(DoctorRent, { foreignKey: "DID", sourceKey: "DID" });
DoctorRent.belongsTo(Doctor, { foreignKey: "DID", targetKey: "DID" });

module.exports = Doctor;
