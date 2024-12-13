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
  const lastPatient = await PatientDetails.findOne({
    order: [['PID', 'DESC']],
    attributes: ['PID'],
  });

  let newPID;

  if (lastPatient && lastPatient.PID) {
    const lastPIDNumber = parseInt(lastPatient.PID.slice(1), 10);
    newPID = `P${String(lastPIDNumber + 1).padStart(5, '0')}`;
  } else {
    newPID = 'P45365';
  }
  
  patient.PID = newPID;
});

PatientDetails.hasOne(PatientAddress, { foreignKey: "PID", sourceKey: "PID" });
PatientAddress.belongsTo(PatientDetails, {
  foreignKey: "PID",
  targetKey: "PID",
});


module.exports = PatientDetails;
