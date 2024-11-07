const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor/Doctor");
const Order = require("../models/Order/Order");
const Address = require("../models/Store/Address");
const Compliances = require("../models/Store/Compliances");
const Contact = require("../models/Store/Contact");
const Location = require("../models/Store/Location");
const Store = require("../models/Store/Store");
const StoreBillingDetail = require("../models/Store/StoreBillingDetail");
const StoreProduct = require("../models/Product/StoreProduct");
const Product = require("../models/Product/Product");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const AccountCategory = require("../models/Doctor/AccountCategory");
const DoctorCompliances = require("../models/Doctor/Compliances");
const ClinicAddress = require("../models/Doctor/ClinicAddress");
const EmailInfo = require("../models/Doctor/EmailInfo");
const PaymentDetails = require("../models/Doctor/PaymentDetails");
const PatientDetails = require("../models/Order/PatientDetails");
const Billing = require("../models/Order/Billing");
const OrderProduct = require("../models/Order/Product");
const PatientAddress = require("../models/Order/Adress");
const DoctorOrderMargins = require("../models/Doctor/DoctorOrderMargins");
const Invoice = require("../models/Order/Invoice");

exports.createStore = async (req, res) => {
  try {
    const { storeDetails, compliances, address, location, contact, billing } =
      req.body;

    // Create Store
    const store = await Store.create(storeDetails);
    const storeId = store.SID;
    if (!storeId) {
      throw new Error("Failed to generate SID for the store.");
    }
    // Create associated records
    await Compliances.create({ ...compliances, SID: storeId });
    await Address.create({ ...address, SID: storeId });
    await Location.create({ ...location, SID: storeId });
    await Contact.create({ ...contact, SID: storeId });

    res
      .status(201)
      .json({ message: "Store and related details created successfully." });
  } catch (err) {
    console.error("Error creating store:", err);
    res
      .status(500)
      .json({ error: "Failed to create store and related details." });
  }
};

exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      include: [Compliances, Address, Location, Contact, Order],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(stores);
  } catch (error) {
    console.error("Error getting all stores:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStoreById = async (req, res) => {
  const SID = req?.params?.id;

  try {
    const store = await Store.findOne({
      where: { SID },
      include: [
        Compliances,
        Address,
        Location,
        Contact,
        Order,
        StoreBillingDetail,
      ],
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    const storeData = store?.get({ plain: true });

    let plainPin;
    try {
      const decoded = jwt.verify(store.pin, process.env.JWT_SECRET);
      plainPin = decoded.pin;
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
    storeData.pin = plainPin;

    res.status(200).json(storeData);
  } catch (error) {
    console.error("Error getting store by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const SID = req?.params?.id;
    const { storeDetails, compliances, address, location, contact, billing } =
      req.body;

    const store = await Store.findOne({
      where: { SID },
    });
    console.log("1111111111111111111111111111111111111111");
    if (!store) return res.status(404).json({ error: "Store not found" });
    console.log("storeDetails.pin", storeDetails?.pin);
    if (storeDetails?.pin) {
      console.log("333333333333333333333333333333333333");
      const token = jwt.sign({ pin: storeDetails.pin }, process.env.JWT_SECRET);
      storeDetails.pin = token;
    }

    console.log("222222222222222222222222222222222222222");
    await store.update(storeDetails);
    await Compliances.update(compliances, { where: { SID } });
    await Address.update(address, { where: { SID } });
    await Location.update(location, { where: { SID } });
    await Contact.update(contact, { where: { SID } });

    if (billing) {
      if (billing.applyAll) {
        const allStores = await Store.findAll();

        for (const store of allStores) {
          const existingStoreBillingDetail = await StoreBillingDetail.findOne({
            where: { SID: store.SID },
          });

          if (!existingStoreBillingDetail) {
            await StoreBillingDetail.create({
              SID: store.SID,
              smallCartFee: billing.smallCartFee || null,
              handlingFee: billing.handlingFee || null,
              deliveryChargesSameState:
                billing.deliveryChargesSameState || null,
              deliveryChargesOtherState:
                billing.deliveryChargesOtherState || null,
              noDiscount: billing.noDiscount || null,
              applyAll: billing.applyAll,
            });
          } else {
            await StoreBillingDetail.update(
              {
                smallCartFee:
                  billing.smallCartFee ||
                  existingStoreBillingDetail.smallCartFee,
                handlingFee:
                  billing.handlingFee || existingStoreBillingDetail.handlingFee,
                deliveryChargesSameState:
                  billing.deliveryChargesSameState ||
                  existingStoreBillingDetail.deliveryChargesSameState,
                deliveryChargesOtherState:
                  billing.deliveryChargesOtherState ||
                  existingStoreBillingDetail.deliveryChargesOtherState,
                noDiscount:
                  billing.noDiscount || existingStoreBillingDetail.noDiscount,
                applyAll: billing.applyAll,
              },
              { where: { SID: store.SID } }
            );
          }
        }
      } else {
        const updateBillingDetails = async (billingField, fieldName) => {
          if (billingField) {
            const existingStoreBillingDetail = await StoreBillingDetail.findOne(
              { where: { SID: store.SID } }
            );

            if (!existingStoreBillingDetail) {
              const newBillingDetail = {};
              newBillingDetail[fieldName] = billingField;
              newBillingDetail.SID = store.SID;
              await StoreBillingDetail.create(newBillingDetail);
            } else {
              const updateData = {};
              updateData[fieldName] = billingField;
              await StoreBillingDetail.update(updateData, {
                where: { SID: store.SID },
              });
            }
          }
        };

        await updateBillingDetails(billing.smallCartFee, "smallCartFee");
        await updateBillingDetails(billing.handlingFee, "handlingFee");
        await updateBillingDetails(
          billing.deliveryChargesSameState,
          "deliveryChargesSameState"
        );
        await updateBillingDetails(
          billing.deliveryChargesOtherState,
          "deliveryChargesOtherState"
        );
        await updateBillingDetails(billing.noDiscount, "noDiscount");
        await updateBillingDetails(billing.applyAll, "applyAll");
      }
    }

    res.status(200).json({ message: "Store updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignDoctorToStore = async (req, res) => {
  const { SID, doctorId } = req.body;

  try {
    const store = await Store.findOne({ where: { SID } });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const doctor = await Doctor.findOne({ where: { DID: doctorId } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.SID) {
      return res
        .status(400)
        .json({ message: "Doctor is already assigned to a store" });
    }

    doctor.SID = SID;
    await doctor.save();

    res.status(200).json({ message: "Store assigned successfully" });
  } catch (error) {
    console.error("Error assigning doctor to store:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  const SID = req.params.id;
  try {
    await StoreProduct.destroy({ where: { SID } });

    const orders = await Order.findAll({ where: { SID } });
    const orderIds = orders?.map((order) => order?.OID);

    await DoctorOrderMargins.destroy({ where: { OID: orderIds } });
    await OrderProduct.destroy({ where: { SID } });
    await Order.destroy({ where: { SID } });

    const store = await Store.destroy({
      where: { SID: SID },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    await Store.destroy({ where: { SID } });
    await Compliances.destroy({ where: { SID } });
    await Address.destroy({ where: { SID } });
    await Location.destroy({ where: { SID } });
    await Contact.destroy({ where: { SID } });

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchStore = async (req, res) => {
  const searchQuery = req.query.search || "";
  try {
    const stores = await Store.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchQuery}%` } },
          { username: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(stores || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoreDetail = async (req, res) => {
  const SID = req.userId;
  try {
    const store = await Store.findOne(
      { where: { SID: SID } },
      {
        include: [Compliances, Address, Location, Contact],
      }
    );
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const lastOrder = await Order.findOne({
      where: { SID: SID },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    res.status(200).json({ store, lastOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.billingStore = async (req, res) => {
  try {
    const {
      smallCartFee,
      handlingFee,
      deliveryChargesSameState,
      deliveryChargesOtherState,
      applyAll,
    } = req.body;

    if (applyAll) {
      const allStores = await Store.findAll();

      for (const store of allStores) {
        const existingStoreBillingDetail = await StoreBillingDetail.findOne({
          where: { SID: store.SID },
        });

        if (!existingStoreBillingDetail) {
          await StoreBillingDetail.create({
            SID: store.SID,
            smallCartFee: smallCartFee ? smallCartFee.charges : null,
            handlingFee: handlingFee ? handlingFee.charges : null,
            deliveryChargesSameState: deliveryChargesSameState
              ? deliveryChargesSameState.charges
              : null,
            deliveryChargesOtherState: deliveryChargesOtherState
              ? deliveryChargesOtherState.charges
              : null,
          });
        } else {
          await StoreBillingDetail.update(
            {
              smallCartFee: smallCartFee
                ? smallCartFee.charges
                : existingStoreBillingDetail.smallCartFee,
              handlingFee: handlingFee
                ? handlingFee.charges
                : existingStoreBillingDetail.handlingFee,
              deliveryChargesSameState: deliveryChargesSameState
                ? deliveryChargesSameState.charges
                : existingStoreBillingDetail.deliveryChargesSameState,
              deliveryChargesOtherState: deliveryChargesOtherState
                ? deliveryChargesOtherState.charges
                : existingStoreBillingDetail.deliveryChargesOtherState,
            },
            { where: { SID: store.SID } }
          );
        }
      }

      return res.status(201).json({ message: "Applied to all stores" });
    } else {
      if (smallCartFee && smallCartFee.storeTitle) {
        const store = await Store.findOne({
          where: { title: smallCartFee.storeTitle },
        });
        const existingStoreBillingDetail = await StoreBillingDetail.findOne({
          where: { SID: store.SID },
        });
        if (!existingStoreBillingDetail) {
          await StoreBillingDetail.create({
            SID: store.SID,
            smallCartFee: smallCartFee.charges,
          });
        } else {
          await StoreBillingDetail.update(
            {
              smallCartFee: smallCartFee.charges,
            },
            { where: { SID: store.SID } }
          );
        }
      }

      if (handlingFee && handlingFee.storeTitle) {
        const store = await Store.findOne({
          where: { title: handlingFee.storeTitle },
        });
        const existingStoreBillingDetail = await StoreBillingDetail.findOne({
          where: { SID: store.SID },
        });
        if (!existingStoreBillingDetail) {
          await StoreBillingDetail.create({
            SID: store.SID,
            handlingFee: handlingFee.charges,
          });
        } else {
          await StoreBillingDetail.update(
            {
              handlingFee: handlingFee.charges,
            },
            { where: { SID: store.SID } }
          );
        }
      }

      if (deliveryChargesSameState && deliveryChargesSameState.storeTitle) {
        const store = await Store.findOne({
          where: { title: handlingFee.storeTitle },
        });
        const existingStoreBillingDetail = await StoreBillingDetail.findOne({
          where: { SID: store.SID },
        });
        if (!existingStoreBillingDetail) {
          await StoreBillingDetail.create({
            SID: store.SID,
            deliveryChargesSameState: deliveryChargesSameState.charges,
          });
        } else {
          await StoreBillingDetail.update(
            {
              deliveryChargesSameState: deliveryChargesSameState.charges,
            },
            { where: { SID: store.SID } }
          );
        }
      }

      if (deliveryChargesOtherState && deliveryChargesOtherState.storeTitle) {
        const store = await Store.findOne({
          where: { title: handlingFee.storeTitle },
        });
        const existingStoreBillingDetail = await StoreBillingDetail.findOne({
          where: { SID: store.SID },
        });
        if (!existingStoreBillingDetail) {
          await StoreBillingDetail.create({
            SID: store.SID,
            deliveryChargesOtherState: deliveryChargesOtherState.charges,
          });
        } else {
          await StoreBillingDetail.update(
            {
              deliveryChargesOtherState: deliveryChargesOtherState.charges,
            },
            { where: { SID: store.SID } }
          );
        }
      }

      res.status(201).json({ message: "Applied" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDoctorsOfStore = async (req, res) => {
  try {
    const SID = req.params.id;
    const doctors = await Store.findAll({
      where: { SID: SID },
      attributes: [],
      include: [
        {
          model: Doctor,
          include: [
            { model: DoctorCompliances },
            { model: AccountCategory },
            { model: PersonalInfo },
            { model: ClinicAddress },
            { model: EmailInfo },
            { model: PaymentDetails },
          ],
        },
      ],
    });
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDoctorsNotAssigned = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      where: { SID: null },
      include: [
        DoctorCompliances,
        AccountCategory,
        PersonalInfo,
        ClinicAddress,
        EmailInfo,
        PaymentDetails,
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsOfDoctor = async (req, res) => {
  try {
    const id = req.userId;
    let storeSID;
    const doctor = await Doctor.findOne({ where: { DID: id } });
    if (doctor) {
      storeSID = doctor.SID;
    } else {
      storeSID = id;
    }

    const products = await StoreProduct.findAll({
      where: { SID: storeSID },
      attributes: [],
      include: [Product],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductsOfStore = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const id = req.userId;

    const { rows: products, count } = await StoreProduct.findAndCountAll({
      where: { SID: id },
      attributes: ["storeStock", "units"],
      include: [Product],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      data: products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.removeDoctorFromStore = async (req, res) => {
  try {
    const DID = req.params.id;
    const SID = req.params.sid;
    const doctor = await Doctor.findOne({
      where: { DID: DID, SID: SID },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.SID === null) {
      return res
        .status(400)
        .json({ error: "Doctor is not associated with any store" });
    }

    doctor.SID = null;
    await doctor.save();

    res.status(200).json({ message: "Doctor removed from store" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStoreStatus = async (req, res) => {
  try {
    const SID = req.userId;
    const { currentStoreStatus } = req.body;

    const store = await Store.findOne({ where: { SID: SID } });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    store.currentStoreStatus = currentStoreStatus;

    await store.update({ currentStoreStatus });

    res.status(200).json({ message: "Store status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const SID = req.userId;

    const { addressType = "", orderType = "" } = req.body;

    const validAddressTypes = ["isClinic", "isCollect", "isAddress"];
    const validOrderTypes = [
      "isPacked",
      "isDispatched",
      "isDelivered",
      "isCancelled",
      "new",
    ];

    let whereConditions = {
      SID,
    };

    let limit = parseInt(req.query.limit) || 10;
    let order = [["createdAt", "ASC"]];

    if (addressType.length === 0 && orderType.length === 0) {
      whereConditions = { SID };
    } else {
      if (addressType.length > 0 && !validAddressTypes.includes(addressType)) {
        return res.status(400).json({ error: "Invalid addressType" });
      }
      if (orderType.length > 0 && !validOrderTypes.includes(orderType)) {
        return res.status(400).json({ error: "Invalid orderType" });
      }

      if (orderType === "new") {
        order = [["createdAt", "DESC"]];
        limit = 10;
        if (addressType.length > 0) {
          whereConditions[addressType] = true;
        }
      } else {
        if (addressType.length > 0) {
          whereConditions[addressType] = true;
        }
        if (orderType.length > 0) {
          whereConditions[orderType] = true;
        }
      }
    }

    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        { model: PatientDetails, include: [PatientAddress] },
        Billing,
        OrderProduct,
        Invoice,
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
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: orders?.length,
      totalPages: Math.ceil(count / limit),
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const calculateDaysDifference = (date) => {
  const today = new Date();
  const orderDate = new Date(date);
  const timeDiff = today - orderDate;
  const daysDifference = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  return daysDifference;
};

const filterOrdersByDosageAndTimeFrame = (orders) => {
  return orders.filter((order) => {
    const has100PercentBalance = order?.orderProducts.some((product) => {
      const rxUnits = Number(product.rxUnits);
      const orderQty = Number(product.orderQty);
      const balanceUnits = rxUnits - orderQty;
      const balanceDosagePercentage =
        rxUnits > 0 ? (balanceUnits / rxUnits) * 100 : 0;
      return balanceDosagePercentage === 100;
    });

    const hasLessThan100PercentBalance = order?.orderProducts.some(
      (product) => {
        const rxUnits = Number(product.rxUnits);
        const orderQty = Number(product.orderQty);
        const balanceUnits = rxUnits - orderQty;
        const balanceDosagePercentage =
          rxUnits > 0 ? (balanceUnits / rxUnits) * 100 : 0;
        return balanceDosagePercentage < 100;
      }
    );

    const daysSinceOrder = calculateDaysDifference(order?.createdAt);

    // Show orders with 100% balance dosage within 1 week
    if (has100PercentBalance && daysSinceOrder <= 7) {
      return true;
    }

    // Show orders with less than 100% balance dosage within 1 month
    if (hasLessThan100PercentBalance && daysSinceOrder <= 30) {
      return true;
    }

    return false; // Filter out orders that don't meet criteria
  });
};

exports.getOrdersWithoutCancel = async (req, res) => {
  try {
    const SID = req.userId;

    const { addressType = "" } = req.body;

    const validAddressTypes = ["isClinic", "isCollect", "isAddress"];

    let whereConditions = {
      SID,
      isCancelled: false,
    };

    if (addressType.length === 0) {
      whereConditions = { SID, isCancelled: false };
    } else {
      if (addressType.length > 0 && !validAddressTypes.includes(addressType)) {
        return res.status(400).json({ error: "Invalid address type" });
      }
      whereConditions[addressType] = true;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        PatientDetails,
        Billing,
        PatientAddress,
        OrderProduct,
        Invoice,
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
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    console.log("orders==================", orders);
    res.status(200).json({
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
