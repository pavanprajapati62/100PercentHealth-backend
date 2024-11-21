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
const PendingDoctorMargin = require("../models/Rent/PendingDoctorMargin");
const PatientDetails = require("../models/Order/PatientDetails");

async function generateMonthlyRent() {
  try {
    const currentMonth = moment().month();
    const currentYear = moment().year();
    console.log("currentYear===", currentYear)
    const previousMonthName = moment().subtract(1, "month").format("MMMM");
    console.log("previousMonthName===", previousMonthName)

    // 1. Get start and end dates for the previous month
    const startOfPreviousMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfPreviousMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    console.log("startOfPreviousMonth====", startOfPreviousMonth)
    console.log("endOfPreviousMonth====", endOfPreviousMonth)

    // 2. Fetch orders from DoctorOrderMargins with isDelivered=true from previous month
    const doctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          as: "order",
          where: { isDelivered: true },
          attributes: [], // No attributes needed from Order
        },
      ],
      attributes: [
        "DID", 
        [
          Sequelize.fn("COUNT", Sequelize.col("doctorOrderMargin.OID")),
          "totalOrders",
        ], 
        [
          Sequelize.fn(
            "SUM",
            Sequelize.col("doctorOrderMargin.marginPercentage")
          ),
          "totalMarginPercentage",
        ],
      ],
      where: {
        createdAt: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
      },
      group: ["doctorOrderMargin.DID"], 
    });

    // console.log("doctorMargins=====", doctorMargins)

    // 3. Fetch previously undelivered orders that are now delivered from PendingDoctorMargins
    const pendingMargins = await PendingDoctorMargin.findAll({
      include: [
        {
          model: Order,
          where: { isDelivered: true },
        },
      ],
    });

    // console.log("pendingMargins=====", pendingMargins)

    // 4. Create rent entries for both DoctorOrderMargins and PendingDoctorMargins data
    const rentData = {};

    // Process delivered orders from DoctorOrderMargins
    for (const margin of doctorMargins) {
      const { DID, totalOrders, totalMarginPercentage } = margin.dataValues;
      if (!rentData[DID]) {
        rentData[DID] = { gateways: 0, fetchedRent: 0 };
      }
      rentData[DID].gateways += totalOrders;
      rentData[DID].fetchedRent += totalMarginPercentage;
    }

    // Process now-delivered orders from PendingDoctorMargin
    for (const entry of pendingMargins) {
      const { DID, marginPercentage, OID } = entry;
      if (!rentData[DID]) {
        rentData[DID] = { gateways: 0, fetchedRent: 0 };
      }
      rentData[DID].gateways += 1; // Each pending order counts as 1 gateway
      rentData[DID].fetchedRent += marginPercentage;

      // Delete processed entry from PendingDoctorMargin
      await PendingDoctorMargin.destroy({ where: { DID, OID } });
    }

    // console.log("rentData=====", rentData)
    // 5. Create DoctorRent entries based on combined data
    const rentPromises = Object.entries(rentData).map(([DID, data]) =>
      DoctorRent.create({
        DID,
        gateways: data.gateways,
        fetchedRent: data.fetchedRent,
        month: previousMonthName,
        year: currentYear,
      })
    );

    // 6. Execute all rent creations
    await Promise.all(rentPromises);

    // Step 3: Fetch Pending Doctor Margins
    const pendingDoctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          where: { isDelivered: false, isCancelled: false },
        },
      ],
      where: {
        createdAt: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
      },
      attributes: ["DID", "OID", "marginPercentage"], // Adjusted to only fetch necessary attributes
    });

    // Step 7: Create Entries in PendingDoctorMargin Table
    for (const pendingOrder of pendingDoctorMargins) {
      await PendingDoctorMargin.create({
        DID: pendingOrder.DID,
        OID: pendingOrder.OID,
        marginPercentage: pendingOrder.marginPercentage,
      });
    }
  } catch (error) {
    console.error("Error generating monthly rent:", error);
    res.status(500).json({ error: error.message });
  }
}

// Not in use
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

// This function is used to get doctor on publish select year and month
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

    if (!doctorRent) {
      return res.status(404).json({ error: "No Record Found" });
    }

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

    const monthNumber = monthMapping[month];
    if (monthNumber === undefined) {
      return res.status(400).json({ error: "Invalid month provided" });
    }

    const startDate = new Date(Date.UTC(year, monthNumber  - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    console.log("startDate===", startDate)
    console.log("endDate===", endDate)

    const orders = await Order.findAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: "Delivered"
      },
      include: [
        {
          model: Billing,
        },
        {
          model: PatientDetails,
          include: [PatientAddress],
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
        },
        {
          model: DoctorOrderMargins, 
          attributes: ["marginPercentage"], 
        },
      ],
      distinct: true,
      order: [["createdAt", "ASC"]],
    });

    const orderData = [];
    const totalDaysInMonth = new Date(year, monthNumber, 0).getDate(); 
    
    for (let day = 1; day <= totalDaysInMonth; day++) {
      orderData.push({
        day: day.toString(),
        orders: 0,
        amt: 0,
      });
    }
    
    orders.forEach((order) => {
      const createdDate = new Date(order.createdAt);  
      const day = createdDate.getUTCDate();  
      const invoiceAmount = parseFloat(order?.invoice?.invoiceAmount) || 0; 

      let existingData = orderData.find((item) => {
        return item.day === day.toString();
      });

      if (existingData) {
        existingData.orders += 1;
        existingData.amt = parseFloat(existingData.amt) + invoiceAmount;
      }
    });

    // Sort the orderData by day in ascending order (though it's already in order due to initialization)
    orderData.sort((a, b) => parseInt(a.day) - parseInt(b.day));

    res.status(200).json({
      data: doctorRent,
      orderData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// This function will return the orders of doctor for specefic month and year on admin panel when click on open report
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
    if (monthNumber === undefined) {
      return res.status(400).json({ error: "Invalid month provided" });
    }

    const startDate = new Date(Date.UTC(year, monthNumber  - 1, 1, 0, 0, 0)).toISOString();

    // Last day of the month at 23:59:59 (Local Time)
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    console.log("startDate=========================", startDate);
    console.log("endDate=========================", endDate);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: "Delivered"
      },
      include: [
        {
          model: Billing,
        },
        {
          model: PatientDetails,
          include: [PatientAddress],
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
        },
        {
          model: DoctorOrderMargins, 
          attributes: ["marginPercentage"], 
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
      limit,
      offset,
    });

    const marginOrders = await Order.findAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: "Delivered"
      },
      include: [{ model: DoctorOrderMargins, attributes: ["marginPercentage"] }]
    });

    const totalMarginPercentage = marginOrders?.filter(order => order.doctorOrderMargin !== null).reduce((sum, order) => sum + order.doctorOrderMargin.marginPercentage, 0);
    console.log("Total Margin Percentage:", totalMarginPercentage);
    const formattedTotalMarginPercentage = parseFloat(totalMarginPercentage.toFixed(2));
    
    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: orders?.count,
      totalPages: Math.ceil(orders?.count / limit),
      totalMarginPercentage: formattedTotalMarginPercentage,
      month: month,
      year: year,
      data: orders?.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  generateMonthlyRent,
  getRent,
  getRentOfDoctor,
  getOrdersOfDoctor,
};
