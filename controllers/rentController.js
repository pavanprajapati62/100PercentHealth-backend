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
const fs = require("fs");


async function generateMonthlyRent() {
  try {
    const currentMonth = moment().month();
    const currentYear = moment().year();
    const previousMonthName = moment().subtract(1, "month").format("MMMM");
    // 1. Get start and end dates for the previous month
    const startOfPreviousMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfPreviousMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();
    
    console.log("currentYear===", currentYear)
    console.log("previousMonthName===", previousMonthName)
    console.log("startOfPreviousMonth====", startOfPreviousMonth)
    console.log("endOfPreviousMonth====", endOfPreviousMonth)

    // 2. Fetch orders from DoctorOrderMargins with isDelivered=true from previous month
    const doctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          as: "order",
          where: {
            [Op.or]: [
              {
                isDelivered: true,
                deliveredTime: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
              },
              {
                isCollected: true,
                collectedTime: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
              },
            ],
          },
          attributes: [], 
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
      group: ["doctorOrderMargin.DID"], 
    });

    // 3. Fetch previously undelivered orders that are now delivered from PendingDoctorMargins
    const pendingMargins = await PendingDoctorMargin.findAll({
      include: [
        {
          model: Order,
          where: { 
            [Op.or]: [
              { isDelivered: true },
              { isCollected: true },
            ],
           },
        },
      ],
    });

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
      rentData[DID].gateways = Number(rentData[DID].gateways) + 1; 
      rentData[DID].fetchedRent += marginPercentage;

      await PendingDoctorMargin.destroy({ where: { DID, OID } });
    }

    // 5. Create DoctorRent entries based on combined data
    const rentRecords = Object.entries(rentData).map(([DID, data]) => ({
      DID,
      gateways: data.gateways,
      fetchedRent: data.fetchedRent,
      month: previousMonthName,
      year: currentYear,
    }));

    const lastDoctorRent = await DoctorRent.findOne({
      order: [['FID', 'DESC']],
      attributes: ['FID'],
    });
    
    let lastFIDNumber = lastDoctorRent && lastDoctorRent.FID 
      ? parseInt(lastDoctorRent.FID.slice(1), 10) 
      : 0; 
    
    rentRecords.forEach((record, index) => {
      lastFIDNumber += 1;
      record.FID = `F${String(lastFIDNumber).padStart(5, '0')}`;
    });
    
    await DoctorRent.bulkCreate(rentRecords);

    // Fetch Pending Doctor Margins to create in PendingDoctorMargins table
    const pendingDoctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          where: {
            [Op.and]: [
              { isCancelled: false },
              { isCollected: false },
              { isDelivered: false },
              { createdAt: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] } },
            ],
          },
        },
      ],
      attributes: ["DID", "OID", "marginPercentage"],
    });

    // Create Entries in PendingDoctorMargin Table
    for (const pendingOrder of pendingDoctorMargins) {
      const { DID, OID, marginPercentage } = pendingOrder;

      const existingEntry = await PendingDoctorMargin.findOne({
        where: { DID, OID },
      });

      if (!existingEntry) {
        await PendingDoctorMargin.create({ DID, OID, marginPercentage });
      }
    }
  } catch (error) {
    console.error("Error generating monthly rent:", error);
    res.status(500).json({ error: error.message });
  }
}

async function testGenerateMonthlyRent(req, res) {
  try {
    const { month, start, end } = req.body;
    const currentMonth = moment().month();
    const currentYear = moment().year();

    const previousMonthName = month;
    const startOfPreviousMonth = start;
    const endOfPreviousMonth = end;

    // 2. Fetch orders from DoctorOrderMargins with isDelivered=true from previous month
    const doctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          as: "order",
          where: {
            [Op.or]: [
              {
                isDelivered: true,
                deliveredTime: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
              },
              {
                isCollected: true,
                collectedTime: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] },
              },
            ],
          },
          attributes: [], 
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
      group: ["doctorOrderMargin.DID"], 
    });

    // 3. Fetch previously undelivered orders that are now delivered from PendingDoctorMargins
    const pendingMargins = await PendingDoctorMargin.findAll({
      include: [
        {
          model: Order,
          where: { 
            [Op.or]: [
              { isDelivered: true },
              { isCollected: true },
            ],
           },
        },
      ],
    });

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
      rentData[DID].gateways = Number(rentData[DID].gateways) + 1; 
      rentData[DID].fetchedRent += marginPercentage;

      await PendingDoctorMargin.destroy({ where: { DID, OID } });
    }

    // 5. Create DoctorRent entries based on combined data
    const rentRecords = Object.entries(rentData).map(([DID, data]) => ({
      DID,
      gateways: data.gateways,
      fetchedRent: data.fetchedRent,
      month: previousMonthName,
      year: currentYear,
    }));

    const lastDoctorRent = await DoctorRent.findOne({
      order: [['FID', 'DESC']],
      attributes: ['FID'],
    });
    
    let lastFIDNumber = lastDoctorRent && lastDoctorRent.FID 
      ? parseInt(lastDoctorRent.FID.slice(1), 10) 
      : 0; 
    
    rentRecords.forEach((record, index) => {
      lastFIDNumber += 1;
      record.FID = `F${String(lastFIDNumber).padStart(5, '0')}`;
    });
    
    await DoctorRent.bulkCreate(rentRecords);

    // Fetch Pending Doctor Margins to create in PendingDoctorMargins table
    const pendingDoctorMargins = await DoctorOrderMargins.findAll({
      include: [
        {
          model: Order,
          where: {
            [Op.and]: [
              { isCancelled: false },
              { isCollected: false },
              { isDelivered: false },
              { createdAt: { [Op.between]: [startOfPreviousMonth, endOfPreviousMonth] } },
            ],
          },
        },
      ],
      attributes: ["DID", "OID", "marginPercentage"],
    });

    // Create Entries in PendingDoctorMargin Table
    for (const pendingOrder of pendingDoctorMargins) {
      const { DID, OID, marginPercentage } = pendingOrder;

      const existingEntry = await PendingDoctorMargin.findOne({
        where: { DID, OID },
      });

      if (!existingEntry) {
        await PendingDoctorMargin.create({ DID, OID, marginPercentage });
      }
    }

    return res.status(200).json({ message: "Genrate monthly rent successfully" });

  } catch (error) {
    console.error("Error generating monthly rent:", error);
    return res.status(500).json({ error: error.message });
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

    if(doctorRent?.isPublished === true) {
      return res.status(400).json({ error: "Record already published" });
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
    const orders = await Order.findAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: {
          [Op.or]: ["Delivered", "Collected"],
        }
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
    
    orders?.forEach((order) => {
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: {
          [Op.or]: ["Delivered", "Collected"],
        }
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
        orderStatus: {
          [Op.or]: ["Delivered", "Collected"],
        }
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

async function createCsvOrdersOfDoctor(req, res) {
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
      return res.status(400).json({ message: "Invalid month provided" });
    }

    const startDate = new Date(Date.UTC(year, monthNumber  - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

    const orders = await Order.findAndCountAll({
      where: {
        DID: DID,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        orderStatus: {
          [Op.or]: ["Delivered", "Collected"],
        }
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

    const doctorReportData = orders?.rows;
     const category = doctorReportData[0]?.doctor?.accountCategory?.category;
     const accCategory = category ? category?.split("_")[1] : ""; 
     const doctorInfo = [
       [
         "Month",
         "Year",
         "Doctor Name",
         "Doctor ID",
         "Acc Category",
         "Clinic Name",
       ],
       [
        month,
        year,
         `${doctorReportData[0]?.doctor?.personalInfo?.name || ""} ${
           doctorReportData[0]?.doctor?.personalInfo?.surname || ""
         }`,
         doctorReportData[0]?.doctor?.personalInfo?.DID || "",
         accCategory?.toUpperCase() || "",
         doctorReportData[0]?.doctor?.personalInfo?.clinicName || "",
       ],
     ];

     const headers = [
       "Sr.No.",
       "C Date",
       "P Date",
       "Time",
       "Order ID",
       "Inv. No.",
       "Inv. Amount",
       "GST",
       "Margin",
       "Trx ID",
     ];
 
     const rows = doctorReportData.map((data, i) => {
       const completedDateObj = data?.deliveredTime ? new Date(data?.deliveredTime) : new Date(data?.collectedTime);
       const completedDate = completedDateObj?.toLocaleDateString("en-GB", {
         day: "2-digit",
         month: "2-digit",
         year: "numeric",
       });
       const completedTime = completedDateObj?.toLocaleTimeString("en-GB", {
         hour: "2-digit",
         minute: "2-digit",
       });
 
       const placedDateObj = new Date(data?.createdAt);
       const placedDate = placedDateObj.toLocaleDateString("en-GB", {
         day: "2-digit",
         month: "2-digit",
         year: "numeric",
       });
       const placedTime = placedDateObj.toLocaleTimeString("en-GB", {
         hour: "2-digit",
         minute: "2-digit",
       });
 
       return [
         i + 1,
         completedDate ? completedDate : "N/A",
         placedDate || "N/A",
         completedTime ? completedTime : "N/A",
         data?.OID || "",
         data?.invoice?.invoiceNo || "",
         data?.invoice?.invoiceAmount || "",
         data?.billing?.gst || "",
         data?.doctorOrderMargin?.marginPercentage || "",
         "N/A",
       ];
     });
 
     const csvContent = [
       ...doctorInfo.map((row) => row.join(",")),
       "",
       headers.join(","),
       ...rows.map((row) => row.join(",")),
     ].join("\n");
 
    //  const filePath = "./doctor_report.csv"; 
    //  fs.writeFileSync(filePath, csvContent, "utf8");
     return res.status(200).json({ csvContent: csvContent });
   } catch (error) {
     return res.status(400).json({ message: "Error generating CSV" });
   }
}

module.exports = {
  generateMonthlyRent,
  testGenerateMonthlyRent,
  getRent,
  getRentOfDoctor,
  getOrdersOfDoctor,
  createCsvOrdersOfDoctor
};
