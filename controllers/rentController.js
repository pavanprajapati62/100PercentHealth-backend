const { Op, Sequelize } = require("sequelize");
const moment = require("moment");
const DoctorOrderMargins = require("../models/Doctor/DoctorOrderMargins");
const DoctorRent = require("../models/Rent/DoctorRent");
const Doctor = require("../models/Doctor/Doctor");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const AccountCategory = require("../models/Doctor/AccountCategory");
const PaymentDetails = require("../models/Doctor/PaymentDetails");
const Order = require("../models/Order/Order");
const PatientAddress = require("../models/Order/Adress");
const Billing = require("../models/Order/Billing");
const Invoice = require("../models/Order/Invoice");
const OrderProduct = require("../models/Order/Product");

async function generateMonthlyRent() {
  try {
    const currentMonth = moment().format("MMMM"); // e.g., "December"
    const currentYear = moment().year(); // e.g., 2024

    // 1. Get all doctors with orders in the current month and year, and aggregate the data
    const doctorMargins = await DoctorOrderMargins.findAll({
      attributes: [
        "DID",
        [Sequelize.fn("COUNT", Sequelize.col("OID")), "totalOrders"],
        [
          Sequelize.fn("SUM", Sequelize.col("marginPercentage")),
          "totalMarginPercentage",
        ],
      ],
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("month").toDate(),
          [Op.lte]: moment().endOf("month").toDate(),
        },
      },
      group: ["DID"],
    });

    // 2. Create rent entries for each doctor
    const rentPromises = doctorMargins.map((margin) => {
      const { DID, totalOrders, totalMarginPercentage } = margin.dataValues;

      return DoctorRent.create({
        DID,
        gateways: totalOrders,
        fetchedRent: totalMarginPercentage,
        month: currentMonth,
        year: currentYear,
      });
    });
    console.log("rentPromises=============", rentPromises);

    // 3. Execute all rent creations
    await Promise.all(rentPromises);

    console.log(`Monthly rent generated for ${doctorMargins.length} doctors.`);
  } catch (error) {
    console.error("Error generating monthly rent:", error);
  }
}

async function getRent(req, res) {
  const doctorMargins = await DoctorOrderMargins.findAll({
    attributes: [
      "DID",
      [Sequelize.fn("COUNT", Sequelize.col("OID")), "totalOrders"],
      [
        Sequelize.fn("SUM", Sequelize.col("marginPercentage")),
        "totalMarginPercentage",
      ],
      // [Sequelize.col("createdAt"), "createdAt"],
      // [Sequelize.col("updatedAt"), "updatedAt"]
    ],
    where: {
      createdAt: {
        [Op.gte]: moment().startOf("month").toDate(),
        [Op.lte]: moment().endOf("month").toDate(),
      },
    },
    group: ["DID"],
    raw: true,
  });
  res.status(200).json({ message: doctorMargins });
}

async function getRentOfDoctor(req, res) {
  try {
    const DID = req.params.id;
    const { month, year } = req.body;

    const doctorRent = await DoctorRent.findOne({
      where: {
        DID: DID,
        month: month, 
        year: year,
      },
      include: [
        {
          model: Doctor,
          include: [PersonalInfo, AccountCategory, PaymentDetails],
        },
      ],
    });

    if(!doctorRent) {
      return res.status(404).json({ error: "No Record Found" })
    }
    res.status(200).json({
      data: doctorRent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// This function will return the orders of doctor for specefic month and year 
async function getOrdersOfDoctor(req, res) {
  try {
    const monthMapping = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    const DID = req.params.id;
    const { month, year } = req.body;

    const monthNumber = monthMapping[month];
    console.log("monthNumber=========================",monthNumber)
    if (monthNumber === undefined) {
      return res.status(400).json({ error: "Invalid month provided" });
    }

    const startDate = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0); 

// Last day of the month at 23:59:59 (Local Time)
const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    console.log("startDate=========================",startDate);
    console.log("endDate=========================",endDate)

    const condition = {
      DID: DID,
      [Op.and]: [
        Sequelize.fn('EXTRACT', 'MONTH', Sequelize.col('createdAt')) == monthNumber,
        Sequelize.fn('EXTRACT', 'YEAR', Sequelize.col('createdAt')) == year,
      ],
    };
    
    const orders = await Order.findAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Billing,
        },
        {
          model: PatientAddress,
        },
        {
          model: Invoice,
        },
        {
          model: OrderProduct,
        },
        {
          model: Doctor,
          include: [PersonalInfo, AccountCategory, PaymentDetails],
        }
      ],
    });


    // if(!doctorRent) {
    //   return res.status(404).json({ error: "No Record Found" })
    // }
    res.status(200).json({
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { generateMonthlyRent, getRent, getRentOfDoctor, getOrdersOfDoctor };
