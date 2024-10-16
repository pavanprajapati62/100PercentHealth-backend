const { Op } = require("sequelize");
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
const Admin = require("../models/Admin");
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
      include: [Compliances, Address, Location, Contact, Order],
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(store);
  } catch (error) {
    console.error("Error getting store by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const SID = req?.params?.id;
    const { storeDetails, compliances, address, location, contact, billing } = req.body;

    const store = await Store.findOne({
      where: { SID },
    });
    if (!store) return res.status(404).json({ error: "Store not found" });

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
              deliveryChargesSameState: billing.deliveryChargesSameState || null,
              deliveryChargesOtherState: billing.deliveryChargesOtherState || null,
              noDiscount: billing.no_discount || null,
            });
          } else {
            await StoreBillingDetail.update(
              {
                smallCartFee: billing.smallCartFee || existingStoreBillingDetail.smallCartFee,
                handlingFee: billing.handlingFee || existingStoreBillingDetail.handlingFee,
                deliveryChargesSameState:
                  billing.deliveryChargesSameState || existingStoreBillingDetail.deliveryChargesSameState,
                deliveryChargesOtherState:
                  billing.deliveryChargesOtherState || existingStoreBillingDetail.deliveryChargesOtherState,
                noDiscount: billing.no_discount || existingStoreBillingDetail.noDiscount,
              },
              { where: { SID: store.SID } }
            );
          }
        }
      } else {
        const updateBillingDetails = async (billingField, fieldName) => {
          if (billingField) {
            const existingStoreBillingDetail = await StoreBillingDetail.findOne({ where: { SID: store.SID } });

            if (!existingStoreBillingDetail) {
              const newBillingDetail = {};
              newBillingDetail[fieldName] = billingField;
              newBillingDetail.SID = store.SID;
              await StoreBillingDetail.create(newBillingDetail);
            } else {
              const updateData = {};
              updateData[fieldName] = billingField;
              await StoreBillingDetail.update(updateData, { where: { SID: store.SID } });
            }
          }
        };

        await updateBillingDetails(billing.smallCartFee, 'smallCartFee');
        await updateBillingDetails(billing.handlingFee, 'handlingFee');
        await updateBillingDetails(billing.deliveryChargesSameState, 'deliveryChargesSameState');
        await updateBillingDetails(billing.deliveryChargesOtherState, 'deliveryChargesOtherState');
        await updateBillingDetails(billing.no_discount, 'noDiscount');
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
    res.status(200).json(store);
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
      attributes: [],
      include: [Product],
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
    const validOrderTypes = ["isPacked", "isDispatched", "isDelivered", "isCancelled", "new"];

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
      order, 
    });

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
