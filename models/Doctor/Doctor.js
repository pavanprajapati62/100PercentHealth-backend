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
});

// Doctor.beforeCreate(async (doctor) => {
//   const sequence = await DoctorSequence.findOne({
//     where: { name: "doctor_id_sequence" },
//   });
//   const newDID = String(sequence.lastId + 1).padStart(3, "0");
//   doctor.DID = newDID;

//   // Hash the PIN before saving
//   const hashedPin = await bcrypt.hash(doctor.pin, 10);
//   doctor.pin = hashedPin;

//   // Update the sequence to the new ID
//   await DoctorSequence.update(
//     { lastId: sequence.lastId + 1 },
//     { where: { name: "doctor_id_sequence" } }
//   );
// });

// Before creating a doctor, generate a unique DID and hash the pin
Doctor.beforeCreate(async (doctor) => {
  const doctorCount = await Doctor.count();
  const newDID = `DID${String(doctorCount + 1).padStart(3, "0")}`;

  // Hash the PIN before saving
  const hashedPin = await bcrypt.hash(doctor.pin, 10);
  doctor.pin = hashedPin;

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

module.exports = Doctor;
