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

const Doctor = sequelize.define("doctor", {
  DID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pinB: {
    type: DataTypes.STRING,
    allowNull: true,
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
  },
  is_pin_b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Before creating a doctor, generate a unique DID and hash the pin
Doctor.beforeCreate(async (doctor) => {
  const doctorCount = await Doctor.count();
  const newDID = `DID${String(doctorCount + 1).padStart(3, "0")}`;

  // Hash the PIN before saving
  const hashedPin = await bcrypt.hash(doctor.pin, 10);
  const hashedPinB = await bcrypt.hash(doctor.pinB, 10);
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
