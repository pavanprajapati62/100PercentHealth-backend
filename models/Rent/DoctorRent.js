const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const DoctorRent = sequelize.define("doctorRent", {
  FID: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  DID: {
    type: DataTypes.STRING,
    references: {
      model: "doctors",
      key: "DID",
    },
    allowNull: false,
  },
  gateways: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fetchedRent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

DoctorRent.beforeCreate(async (doctorRent) => {
  const lastDoctorRent = await DoctorRent.findOne({
    order: [['FID', 'DESC']],
    attributes: ['FID'],
  });

  let newFID;

  if (lastDoctorRent && lastDoctorRent.FID) {
    const lastFIDNumber = parseInt(lastDoctorRent.FID.slice(1), 10); 
    newFID = `F${String(lastFIDNumber + 1).padStart(5, '0')}`;
  } else {
    newFID = 'F00001';
  }  

  doctorRent.FID = newFID;
});

module.exports = DoctorRent;
