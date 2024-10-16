const { sequelize } = require("../config/db");
const ClinicAddress = require("../models/Doctor/ClinicAddress");
const Doctor = require("../models/Doctor/Doctor");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const PatientAddress = require("../models/Order/Adress");
const Billing = require("../models/Order/Billing");
const Invoice = require("../models/Order/Invoice");
const Order = require("../models/Order/Order");
const PatientDetails = require("../models/Order/PatientDetails");
const OrderProduct = require("../models/Order/Product");
const Store = require("../models/Store/Store");

exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.userId;
    const { patient, products, billing, delivery, payment, prescription, DID } =
      req.body;

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

    const order = await Order.create(
      {
        payment,
        isClinic: delivery.isClinic || false,
        isCollect: delivery.isCollect || false,
        isAddress: delivery.isAddress || false,
        prescription: prescription || "",
        SID: store.SID,
        DID: doctor.DID,
      },
      { transaction }
    );
    const orderOID = order.OID;

    if (!orderOID) {
      throw new Error("Failed to generate OID for the order.");
    }

    const patientDetail = await PatientDetails.create(
      {
        ...patient,
        OID: orderOID,
        DID: doctor.DID,
      },
      { transaction }
    );

    await Billing.create({ ...billing, OID: orderOID }, { transaction });

    if (delivery.address) {
      await PatientAddress.create(
        {
          ...delivery.address,
          PID: patientDetail.PID,
          OID: orderOID,
        },
        { transaction }
      );
    }

    if (products && products.length > 0) {
      const productPromises = products.map((product) =>
        OrderProduct.create({ ...product, OID: orderOID }, { transaction })
      );
      await Promise.all(productPromises);
    }

    await transaction.commit();
    res
      .status(201)
      .json({ message: "Order and related details created successfully." });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    res.status(200).json({
      message: "File uploaded successfully",
      filePath: filePath,
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred during the upload" });
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

    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        PatientDetails,
        Billing,
        PatientAddress,
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
      ],
      limit,
      offset,
      order: [["createdAt", "ASC"]],
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
        await OrderProduct.update(productDetails, {
          where: { id: productId, OID },
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

exports.updateOrderStatus = async (req, res) => {
  const OID = req.params.id;
  const { isAccepted, isPacked, isDispatched, isDelivered } = req.body;

  try {
    const order = await Order.findOne({ where: { OID } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (isAccepted) {
      order.isAccepted = true;
      order.orderStatus = "Accepted";
    }
    if (isPacked) {
      order.isPacked = true;
      order.orderStatus = "Packed";
    }
    if (isDispatched) {
      order.isDispatched = true;
      order.orderStatus = "Dispatched";
    }
    if (isDelivered) {
      order.isDelivered = true;
      order.orderStatus = "Delivered";
    }

    await order.save();

    return res
      .status(200)
      .json({ message: "Order status updated successfully" });
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
