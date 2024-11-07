const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");
const PatientAddress = require("./Adress");
const Order = require("./Order");

const PatientDetails = sequelize.define("patientDetails", {
  PID: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  // OID: {
  //   type: DataTypes.STRING,
  //   references: {
  //     model: "orders",
  //     key: "OID",
  //   },
  //   allowNull: false,
  // },
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

PatientDetails.beforeCreate(async (patient) => {
  // const paytientDetailsCount = await PatientDetails.count();
  // const newPID = `PID${String(paytientDetailsCount + 1).padStart(3, "0")}`;

  const lastPatient = await PatientDetails.findOne({
    order: [['PID', 'DESC']],
    attributes: ['PID'],
  });

  let newPID;

  if (lastPatient && lastPatient.PID) {
    const lastPIDNumber = parseInt(lastPatient.PID.slice(3), 10);
    newPID = `PID${String(lastPIDNumber + 1).padStart(3, '0')}`;
  } else {
    // First time creation, start with PID001
    newPID = 'PID001';
  }

  patient.PID = newPID;
});

PatientDetails.hasOne(PatientAddress, { foreignKey: "PID", sourceKey: "PID" });
PatientAddress.belongsTo(PatientDetails, {
  foreignKey: "PID",
  targetKey: "PID",
});


module.exports = PatientDetails;
