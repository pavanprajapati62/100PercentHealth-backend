const { sequelize } = require("../config/db");
const AccountCategory = require("../models/Doctor/AccountCategory");
const ClinicAddress = require("../models/Doctor/ClinicAddress");
const Doctor = require("../models/Doctor/Doctor");
const DoctorOrderMargins = require("../models/Doctor/DoctorOrderMargins");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const PatientAddress = require("../models/Order/Adress");
const Billing = require("../models/Order/Billing");
const Invoice = require("../models/Order/Invoice");
const Order = require("../models/Order/Order");
const PatientDetails = require("../models/Order/PatientDetails");
const OrderProduct = require("../models/Order/Product");
const Product = require("../models/Product/Product");
const ProductMargin = require("../models/Product/ProductMargin");
const StoreProduct = require("../models/Product/StoreProduct");
const Store = require("../models/Store/Store");
const { cloudinaryUploadImage } = require("../utils/cloudinary");
const moment = require("moment");

exports.createOrder = async (req, res) => {
  try {
    const id = req.userId;
    const {
      patient,
      products,
      billing,
      delivery,
      payment,
      prescription,
      DID,
      filePath,
    } = req.body;

    if (id.startsWith("DID")) {
      var doctor = await Doctor.findOne({
        where: { DID: id },
      });
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      var store = await Store.findOne({
        where: { SID: doctor.SID },
      });
    } else {
      var doctor = await Doctor.findOne({
        where: { DID: DID },
      });
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      var store = await Store.findOne({
        where: { SID: doctor.SID },
      });
    }
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    console.log("doctor.DID====================", doctor.DID)

    let patientDetails = await PatientDetails.findOne({
      where: { phoneNumber: patient?.phoneNumber },
    });

    if (!patientDetails) {
      // Create new patient details if not found
      patientDetails = await PatientDetails.create({
        ...patient,
        DID: doctor.DID,
      });
    }

    const PID = patientDetails.PID;

    const order = await Order.create({
      payment,
      isClinic: delivery.isClinic || false,
      isCollect: delivery.isCollect || false,
      isAddress: delivery.isAddress || false,
      prescription: prescription || "",
      SID: store.SID,
      DID: doctor.DID,
      filePath: filePath || "",
      PID,
    });
    const orderOID = order.OID;

    if (!orderOID) {
      throw new Error("Failed to generate OID for the order.");
    }

    await Billing.create({ ...billing, OID: orderOID });

    let patientAddress = await PatientAddress.findOne({
      where: { PID: PID }, // Change this to your specific logic if needed
    });

    if (patientAddress) {
      // Update existing address
      await patientAddress.update({ ...delivery.address });
    } else if (delivery?.address) {
      // Create new address if it doesn't exist
      await PatientAddress.create({
        ...delivery.address,
        PID: patientDetails.PID,
      });
    }

    if (products && products.length > 0) {
      const productPromises = products.map((product) =>
        OrderProduct.create({
          ...product,
          OID: orderOID,
          IID: product?.productId,
          SID: store.SID,
        })
      );
      await Promise.all(productPromises);
    }

    res.status(201).json({ message: order });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // const ipAddress = "192.168.0.121"; // Replace with your local machine's IP
    // const port = 5000; // Make sure this matches your server's port

    // console.log("req.file.filename==============", req.file.filename);
    // // const fileUrl = `http://${ipAddress}:${port}/public/images/${req.file.filename}`;

    // const fileUrl = `https://health100.manageprojects.in/public/images/${req.file.filename}`;
    // console.log("fileUrl=============",fileUrl)

    // const fileUrl1 = `/var/www/100PercentHealth-backend/public/images/${req.file.filename}`;
    var locaFilePath = req?.file?.path;
    if (locaFilePath) {
      var result = await cloudinaryUploadImage(locaFilePath);
    }

    res.status(200).json({
      message: "File uploaded successfully",
      filePath: result?.url,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const OID = req?.params?.id;
    const order = await Order.findOne({
      where: { OID },
      include: [PatientDetails, Billing, PatientAddress, OrderProduct],
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const filter = req.query?.filter || "all";

    let whereClause = {};
    if (filter === "isClinic") {
      whereClause.isClinic = true;
    } else if (filter === "isCollect") {
      whereClause.isCollect = true;
    } else if (filter === "isAddress") {
      whereClause.isAddress = true;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        PatientDetails,
        Billing,
        // PatientAddress,
        OrderProduct,
        {
          model: Doctor,
          attributes: ["DID", "contactNumber", "role"],
          include: [
            {
              model: PersonalInfo,
            },
            {
              model: ClinicAddress,
              attributes: ["premisesName", "clinicContactNumber"],
            },
          ],
        },
        Invoice
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const OID = req?.params?.id;
    const {
      patient,
      products,
      billing,
      delivery,
      payment,
      prescription,
      invoice,
    } = req.body;

    const order = await Order.findOne({
      where: { OID },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const updatedPrescription =
      prescription !== undefined ? prescription : order.prescription;

    await order.update({
      payment,
      isClinic: delivery.isClinic || false,
      isCollect: delivery.isCollect || false,
      isAddress: delivery.isAddress || false,
      prescription: updatedPrescription,
    });

    await PatientDetails.update(patient, { where: { OID } });
    await Billing.update(billing, { where: { OID } });

    if (delivery.isClinic || delivery.isCollect) {
      await PatientAddress.destroy({ where: { OID } });
    } else if (delivery.isAddress && delivery.address) {
      await PatientAddress.update(delivery.address, { where: { OID } });
    }

    if (products && products.length > 0) {
      for (const product of products) {
        const { productId, ...productDetails } = product;
        console.log("productId", productId);
        await OrderProduct.update(productDetails, {
          where: { IID: productId, OID },
        });
      }
    }

    if (invoice) {
      await Invoice.create({
        invoiceNo: invoice.invoiceNo,
        invoiceAmount: invoice.invoiceAmount,
        OID: OID,
      });
    }

    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  const OID = req.params.id;
  try {
    const order = await Order.destroy({
      where: { OID: OID },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMargin = (mrp, categoryPercentage) => {
  const margin = (mrp * categoryPercentage) / 100;
  return parseFloat(margin.toFixed(2));
};

const getDoctorMargin = async (orderId, doctorId, orderProducts) => {
  try {
    const doctor = await Doctor.findOne({
      where: { DID: doctorId },
      include: [{ model: AccountCategory }],
    });
    const doctorData = doctor.get({ plain: true });

    let totalMarginPercentage = 0;
    for (let i = 0; i < orderProducts.length; i++) {
      const { IID, mrp } = orderProducts[i];
      const product = await Product.findOne({
        where: { IID: IID },
        include: [{ model: ProductMargin }],
      });
      const productData = product?.get({ plain: true });

      const doctorCategory = doctorData?.accountCategory?.category;
      const categoryPercentage = productData?.productMargin[doctorCategory];

      if (categoryPercentage !== undefined) {
        const margin = getMargin(mrp, categoryPercentage);
        totalMarginPercentage += margin;
      }
    }

    await DoctorOrderMargins.create({
      DID: doctorId,
      OID: orderId,
      marginPercentage: totalMarginPercentage,
    });

    return totalMarginPercentage;
  } catch (error) {
    console.error("Error fetching doctor margin:", error);
    throw error;
  }
};

exports.updateOrderStatus = async (req, res) => {
  const OID = req.params.id;
  const { isAccepted, isPacked, isDispatched, isDelivered } = req.body;

  try {
    const order = await Order.findOne({
      where: { OID },
      include: [{ model: OrderProduct }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const orderData = order.get({ plain: true });

    let invoiceData = null;

    if (isAccepted) {
      for (let i = 0; i < orderData.orderProducts.length; i++) {
        const { IID, SID, orderQty } = orderData.orderProducts[i];
        const storeProduct = await StoreProduct.findOne({
          where: { IID: IID, SID: SID },
        });
        const storeProductData = storeProduct?.get({ plain: true });

        if (storeProductData?.storeStock < orderQty) {
          return res.status(404).json({
            message: `Store ${SID} stock is less than the required units`,
          });
        }
      }

      try {
        await sequelize.transaction(async (t) => {
          for (let i = 0; i < orderData?.orderProducts.length; i++) {
            const { IID, SID, orderQty } = orderData?.orderProducts[i];
            const storeProduct = await StoreProduct.findOne({
              where: { IID: IID, SID: SID },
              transaction: t,
            });
            if (!storeProduct) {
              return res
                .status(404)
                .json({ message: "Store Product not found" });
            }
            console.log("storeProduct==================", storeProduct);
            const newStock = storeProduct.storeStock - orderQty;

            await storeProduct.update(
              { storeStock: newStock },
              { transaction: t }
            );
          }
        });
      } catch (error) {
        return res.status(500).json({ message: error });
      }

      order.isAccepted = true;
      order.orderStatus = "Accepted";
      order.acceptTime = new Date();

      const { payableAmount } = await Billing.findOne({
        where: { OID: OID },
      });

      // const invoiceCount = await Invoice.count();
      // const newIVID = `IVID${String(invoiceCount + 1).padStart(3, "0")}`;

      const lastInvoice = await Invoice.findOne({
        order: [["IVID", "DESC"]],
        attributes: ["IVID"],
      });

      let newIVID;

      if (lastInvoice && lastInvoice.IVID) {
        const lastIVIDNumber = parseInt(lastInvoice.IVID.slice(4), 10);
        newIVID = `IVID${String(lastIVIDNumber + 1).padStart(3, "0")}`;
      } else {
        // First time creation, start with IVID001
        newIVID = "IVID001";
      }

      invoiceData = await Invoice.create({
        IVID: newIVID,
        OID,
        invoiceNo: newIVID,
        invoiceAmount: payableAmount,
      });

      var doctorMargin = await getDoctorMargin(
        orderData.OID,
        orderData.DID,
        orderData?.orderProducts
      );
    }
    if (isPacked) {
      order.isPacked = true;
      order.orderStatus = "Packed";
      order.packedTime = new Date();

      const duration = moment.duration(moment(order.packedTime).diff(moment(order.acceptTime)));
      order.QP = `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes`;
    }
    if (isDispatched) {
      order.isDispatched = true;
      order.orderStatus = "Dispatched";
      order.dispatchTime = new Date();

      const duration = moment.duration(moment(order.dispatchTime).diff(moment(order.acceptTime)));
      order.QD = `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes`;
    }
    if (isDelivered) {
      order.isDelivered = true;
      order.orderStatus = "Delivered";
      order.deliveredTime = new Date();

      if (order.packedTime) {
        // Calculate PC (Packed to Delivered Time)
        const duration = moment.duration(moment(order.deliveredTime).diff(moment(order.packedTime)));
        order.PC = `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes`;
      }

      if (order.dispatchTime) {
        // Calculate DC (Dispatch to Delivered Time)
        const duration = moment.duration(moment(order.deliveredTime).diff(moment(order.dispatchTime)));
        order.DC = `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes`;
      }

      if (order.acceptTime) {
        // Calculate ET (Accept to Delivered Time)
        const duration = moment.duration(moment(order.deliveredTime).diff(moment(order.acceptTime)));
        order.ET = `${duration.days()} days ${duration.hours()} hours ${duration.minutes()} minutes`;
      }
    }

    await order.save();

    if (invoiceData !== null) {
      return res.status(200).json({
        message: "Order status updated and invoice created successfully",
        invoiceData,
        doctorMargin,
      });
    } else {
      return res
        .status(200)
        .json({ message: "Order status updated successfully" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const OID = req.params.id;
  const { cancelReason } = req.body;

  try {
    const order = await Order.findOne({ where: { OID } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isAccepted = false;
    order.isPacked = false;
    order.isDispatched = false;
    order.isDelivered = false;
    order.isCancelled = true;
    order.orderStatus = null;
    if (cancelReason) {
      order.cancelReason = cancelReason;
    }

    await order.save();

    return res.status(200).json({ message: "Order canceled successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getPatientByID = async (req, res) => {
  try {
    const patientID = req.params.id;
    const patient = await PatientDetails.findOne({
      where: { PID: patientID },
      include: [{ model: PatientAddress }, {model: Order}],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch(error) {
    return res.status(500).json({ error: error.message });
  }
}