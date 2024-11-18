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
const { generateLabelHTML } = require("../pdf/labelhtmlTemplate");
const puppeteer = require("puppeteer");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dsp7l7i4e",
  api_key: "478458651528647",
  api_secret: "Z1qVxAqDzs51O_A9oTcUKi-DJD4",
});

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
    if (!store) return res.status(404).json({ error: "Store not found" });

    if (storeDetails?.pin) {
      const token = jwt.sign({ pin: storeDetails.pin }, process.env.JWT_SECRET);
      storeDetails.pin = token;
    }

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

// This function is used to add products in frequent
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
      attributes: ['storeStock'],
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

// This function is used to get orders of store on store and admin panel
exports.getOrders = async (req, res) => {
  try {
    const SID = req.params.id;

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

    if (addressType.length === 0 && orderType.length === 0) {
      whereConditions = { SID };
    } else {
      if (addressType.length > 0 && !validAddressTypes.includes(addressType)) {
        return res.status(400).json({ error: "Invalid addressType" });
      }
      if (orderType.length > 0 && !validOrderTypes.includes(orderType)) {
        return res.status(400).json({ error: "Invalid orderType" });
      }

      // Apply addressType condition if specified
      if (addressType.length > 0) {
        whereConditions[addressType] = true;
      }

      // Apply orderType condition
      if (orderType === "new") {
        whereConditions.orderStatus = null;
      } else {
        // Map orderType to corresponding orderStatus and ensure other statuses are not set
        if (orderType === "isPacked") {
          whereConditions.orderStatus = "Packed";
        } else if (orderType === "isDispatched") {
          whereConditions.orderStatus = "Dispatched";
        } else if (orderType === "isDelivered") {
          whereConditions.orderStatus = "Delivered";
        } else if (orderType === "isCancelled") {
          whereConditions.isCancelled = true;
          whereConditions.orderStatus = "Cancelled";
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
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const [allCount, clinicCount, collectCount, addressCount, newCount, acceptedCount, packedCount, dispatchedCount, deliveredCount, cancelledCount] = await Promise.all([
      Order.count({ where: { SID } }),
      Order.count({ where: { SID, isClinic: true } }),
      Order.count({ where: { SID, isCollect: true } }),
      Order.count({ where: { SID, isAddress: true } }),
      Order.count({ where: { SID, orderStatus: null } }), // New orders with no status yet
      Order.count({ where: { SID, orderStatus: "Accepted" } }),
      Order.count({ where: { SID, orderStatus: "Packed" } }),
      Order.count({ where: { SID, orderStatus: "Dispatched" } }),
      Order.count({ where: { SID, orderStatus: "Delivered" } }),
      Order.count({ where: { SID, isCancelled: true, orderStatus: "Cancelled" } }),
    ]);

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      counts: {
        all: allCount,
        isClinic: clinicCount,
        isCollect: collectCount,
        isAddress: addressCount,
        new: newCount,
        isAccepted: acceptedCount,
        isPacked: packedCount,
        isDispatched: dispatchedCount,
        isDelivered: deliveredCount,
        isCancelled: cancelledCount,
      },
      orders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrdersWithoutCancel = async (req, res) => {
  try {
    const SID = req.userId;

    let whereConditions = {
      SID,
      isCancelled: false,
      balanceDosageTime: {
        [Op.gt]: new Date(), // Only include orders with balanceDosageTime in the future
      },
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const ordersWithoutCancel = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        PatientDetails,
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
      distinct: true,
      limit,
      offset,
    });
    
    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: ordersWithoutCancel?.count,
      totalPages: Math.ceil(ordersWithoutCancel?.count / limit),
      data: ordersWithoutCancel?.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLabelPdf = async (req, res) => {
  try {
    const data = req.body;
    const urls = [];
    const maxLabelsPerPage = 3; 
    const browser = await puppeteer.launch();

    const extraMap = data.product.reduce((map, product) => {
      if (!map[product.extra]) {
        map[product.extra] = [];
      }
      map[product.extra].push(product.productName);
      return map;
    }, {});

    for (const product of data.product) {
      const extraMedicineName = extraMap[product.extra]?.filter(
        (name) => name !== product.productName
      ) || [];
      const orderQty = parseInt(product.orderQty, 10);

      // Create a new page for each product
      const page = await browser.newPage();
      const htmlContentArray = [];

      // Generate paginated HTML content
      for (let i = 0; i < orderQty; i += maxLabelsPerPage) {
        const currentBatch = [];
        for (let j = i; j < i + maxLabelsPerPage && j < orderQty; j++) {
          const htmlContent = generateLabelHTML(product, extraMedicineName);
          currentBatch.push(htmlContent);
        }
        const batchHtml = currentBatch.join('');
        htmlContentArray.push(
          `<div style="page-break-after: always;">${batchHtml}</div>`
        );
      }

      // Join all pages into a single string
      const combinedHtmlContent = htmlContentArray.join('');

      await page.setContent(combinedHtmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      const uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'raw' }, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        }).end(pdfBuffer);
      });

      const uploadedUrl = await uploadPromise;
      urls.push(uploadedUrl);

      await page.close();
    }

    await browser.close();

    res.status(200).json({ success: true, urls });
  } catch (error) {
    console.error('Error generating PDF labels:', error);
    res.status(500).json({ error: error.message });
  }
};
