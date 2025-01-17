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
const { admin, sendNotification } = require("../config/firebase");
const fs = require("fs").promises;
const { sendDoctorNotification } = require("../config/firebase");
const Contact = require("../models/Store/Contact");

const filterOrdersByDosageAndTimeFrame = async (orders) => {
  try {
    if (!orders?.orderProducts || orders.orderProducts.length === 0) {
      return 0;
    }

    // Calculate balanceDosagePercentage for each product
    const percentages = orders.orderProducts.map((product) => {
      const balanceUnits = parseFloat(product.balanceUnits) || 0;
      const rxUnits = parseFloat(product.rxUnits) || 1; // Avoid division by zero

      // Calculate balanceDosagePercentage
      const percentage = (balanceUnits / rxUnits) * 100;

      return percentage;
    });
    console.log("percentages============", percentages)

    // Return the minimum balanceDosagePercentage
    const minPercentage = Math.min(...percentages);
    console.log("minPercentage====", minPercentage)

    return minPercentage.toFixed(2);
  } catch (error) {
    throw new Error(error);
  }
};

exports.createOrder = async (req, res) => {
  let createdRecords = {
    order: null,
    billing: null,
    patientDetails: null,
    patientAddress: null,
    products: [],
  };
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
      pdfPath,
    } = req.body;

    if (id.startsWith("D")) {
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

    let patientDetails = await PatientDetails.findOne({
      where: { phoneNumber: patient?.phoneNumber },
    });

    if (!patientDetails) {
      patientDetails = await PatientDetails.create({
        ...patient,
        DID: doctor.DID,
      });
      createdRecords.patientDetails = patientDetails;
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
      pdfPath: pdfPath || "",
      PID,
      addressType: delivery?.isAddress ? delivery?.address?.addressType : null,
      premisesNoFloor: delivery?.isAddress
        ? delivery?.address?.premisesNoFloor
        : "",
      premisesName: delivery?.isAddress ? delivery?.address?.premisesName : "",
      landmark: delivery?.isAddress ? delivery?.address?.landmark : "",
      areaRoad: delivery?.isAddress ? delivery?.address?.areaRoad : "",
      city: delivery?.isAddress ? delivery?.address?.city : "",
      pincode: delivery?.isAddress ? delivery?.address?.pincode : "",
      state: delivery?.isAddress ? delivery?.address?.state : "",
      phoneNumber2: delivery?.isAddress ? delivery?.address?.phoneNumber2 : "",
    });
    const orderOID = order.OID;

    createdRecords.order = order;

    if (!orderOID) {
      throw new Error("Failed to generate OID for the order.");
    }

    const billingRecord = await Billing.create({ ...billing, OID: orderOID });
    createdRecords.billing = billingRecord;

    let patientAddress = await PatientAddress.findOne({
      where: { PID: PID },
    });
    console.log("patientAddress", patientAddress)

    if (patientAddress) {
      // Update existing address
      await patientAddress.update({ ...delivery.address });
    } else if (delivery?.address) {
      patientAddress = await PatientAddress.create({
        ...delivery.address,
        PID: patientDetails.PID,
      });
      createdRecords.patientAddress = patientAddress;
    }

    if (products && products.length > 0) {
      const productPromises = products.map((product) =>
        OrderProduct.create({
          ...product,
          OID: orderOID,
          IID: product?.productId,
          SID: store.SID,
        }).then((createdProduct) => createdRecords.products.push(createdProduct))
      );
      await Promise.all(productPromises);
    }

    const orderData = await Order.findOne({
      where: { OID: orderOID },
      include: [OrderProduct],
    });
    const data = orderData.get({ plain: true });
    const percentage = await filterOrdersByDosageAndTimeFrame(data);
    console.log("percentage===", percentage)
    await orderData.update({ balanceDosagePercentage: percentage});

    const tokens = store?.fcmToken; // Get the fcmTokens of the store
    const notificationMessage = {
      title: "New Order Created",
      body: `Order with ID ${orderOID} has been successfully created.`,
    };

    await sendNotification(tokens, notificationMessage);

    res.status(201).json({ message: orderData });
  } catch (err) {
    if (createdRecords?.products?.length > 0) {
      await Promise.all(
        createdRecords.products.map((product) => product.destroy())
      );
    }
    if (createdRecords?.patientAddress) {
      await createdRecords.patientAddress.destroy();
    }
    if (createdRecords?.billing) {
      await createdRecords.billing.destroy();
    }
    if (createdRecords?.order) {
      await createdRecords.order.destroy();
    }
    if (createdRecords?.patientDetails) {
      await createdRecords.patientDetails.destroy();
    }
    res.status(500).json({ error: err });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    let url = "";
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    var locaFilePath = req?.file?.path;
    if (locaFilePath) {
      var result = await cloudinaryUploadImage(locaFilePath);
      await fs.unlink(locaFilePath);
      url = result?.url
    }

    if(url) {
      return res.status(200).json({
        message: "File uploaded successfully",
        filePath: url,
      });
    }

    return res.status(400).json({
      message: "Failed to upload file.",
    });

  } catch (error) {
    return res.status(500).json({ error: error });
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

// This function is used to get orders on admin panel list
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

    const data = await Order.findAndCountAll({
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
        Invoice,
        DoctorOrderMargins,
      ],
      distinct: true,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: data?.count,
      totalPages: Math.ceil(data?.count / limit),
      orders: data?.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const OID = req?.params?.id;
    const id = req.userId;

    const {
      patient,
      products,
      billing,
      delivery,
      payment,
      prescription,
      invoice,
      filePath,
      pdfPath
    } = req.body;

    const order = await Order.findOne({
      where: { OID },
      include: [OrderProduct]
    });
    const dataOrder = await order.get({plain: true});

    if (!order) return res.status(404).json({ error: "Order not found" });

    const updatedPrescription =
      prescription !== undefined ? prescription : order.prescription;

    await order.update({
      payment,
      isClinic: delivery.isClinic || false,
      isCollect: delivery.isCollect || false,
      isAddress: delivery.isAddress || false,
      prescription: updatedPrescription,
      filePath: filePath || "",
      pdfPath: pdfPath || "",
    });

    if (id) {
      if (id.startsWith("S")) {
        await order.update({
          isOrderEdited: true,
        });
      }
    }

    if (patient) {
      var patientDetail = await PatientDetails.findOne({
        where: { phoneNumber: patient?.phoneNumber },
      });
      if (patientDetail) {
        await PatientDetails.update(patient, {
          where: { PID: patientDetail?.PID },
        });
      }
    }

    await Billing.update(billing, { where: { OID } });

    if (delivery.isAddress && delivery.address) {
      const patientAddress = await PatientAddress.findOne({
        where: { PID: patientDetail?.PID },
      });
      if (patientAddress) {
        await PatientAddress.update(delivery.address, {
          where: { PID: patientDetail?.PID },
        });
      } else {
        await PatientAddress.create({
          ...delivery.address,
          PID: patientDetail?.PID,
        });
      }

      await order.update({
        addressType: delivery?.isAddress ? delivery?.address?.addressType : null,
        premisesNoFloor: delivery?.isAddress ? delivery?.address?.premisesNoFloor : "",
        premisesName: delivery?.isAddress ? delivery?.address?.premisesName : "",
        landmark: delivery?.isAddress ? delivery?.address?.landmark : "",
        areaRoad: delivery?.isAddress ? delivery?.address?.areaRoad : "",
        city: delivery?.isAddress ? delivery?.address?.city : "",
        pincode: delivery?.isAddress ? delivery?.address?.pincode : "",
        state: delivery?.isAddress ? delivery?.address?.state : "",
        phoneNumber2: delivery?.isAddress ? delivery?.address?.phoneNumber2 : "",
      })
    }

    if (products && products.length > 0) {

      const existingProducts = dataOrder?.orderProducts;
      for (const existingProduct of existingProducts) {
        const productInPayload = products.find((product) => {
          return product.productId === existingProduct.IID;
        });

        if (!productInPayload) {
          await OrderProduct.destroy({
            where: { id: existingProduct.id, OID: OID }
          });
        }
      }

      for (const product of products) {
        const { productId, ...productDetails } = product;
        const existingProduct = await OrderProduct.findOne({
          where: { IID: productId, OID },
        });

        if (existingProduct) {
          await existingProduct.update(productDetails);
        } else {
          await OrderProduct.create({
            OID,
            IID: productId,
            SID: order?.SID,
            ...productDetails,
          });
        }
      }

      const orderData = await Order.findOne({
        where: { OID: OID },
        include: [OrderProduct],
      });
      const data = orderData.get({ plain: true });

      const percentage = await filterOrdersByDosageAndTimeFrame(data);
      console.log("percentage=====", percentage)
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

const createDoctorMargin = async (orderId, doctorId, orderProducts) => {
  try {
    const doctor = await Doctor.findOne({
      where: { DID: doctorId },
      include: [{ model: AccountCategory }],
    });
    const doctorData = doctor.get({ plain: true });

    let totalMarginPercentage = 0;
    for (let i = 0; i < orderProducts.length; i++) {
      const { IID, mrp, orderQty } = orderProducts[i];
      const product = await Product.findOne({
        where: { IID: IID },
        include: [{ model: ProductMargin }],
      });
      const productData = product?.get({ plain: true });

      const doctorCategory = doctorData?.accountCategory?.category;
      const categoryPercentage = productData?.productMargin[doctorCategory];

      if (categoryPercentage !== undefined) {
        const margin = getMargin(mrp, categoryPercentage);
        totalMarginPercentage += margin*orderQty;
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
  const { isAccepted, isPacked, isCollected, isDispatched, isDelivered, invoice } = req.body;

  try {
    const order = await Order.findOne({
      where: { OID },
      include: [{ model: OrderProduct }],
    });
    const doctor = await Doctor.findOne({
      where: { DID: order.DID },
      attributes: ['fcmToken'],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const orderData = order.get({ plain: true });

    let invoiceData = await Invoice.findOne({ where: { OID } });

    if (isAccepted) {
      for (let i = 0; i < orderData.orderProducts.length; i++) {
        const { IID, SID, orderQty, productName } = orderData.orderProducts[i];
        const storeProduct = await StoreProduct.findOne({
          where: { IID: IID, SID: SID },
          include: [Product]
        });
        const storeProductData = storeProduct?.get({ plain: true });

        if (storeProductData && storeProductData?.storeStock < orderQty) {
          return res.status(404).json({
            message: `Insufficient stock for ${productName} to fulfill the required quantity. Please contact to administration.`
          });
        }
      }

      await sequelize.transaction(async (t) => {
        for (let i = 0; i < orderData?.orderProducts.length; i++) {
          const { IID, SID, orderQty, productName } = orderData?.orderProducts[i];

          const storeProduct = await StoreProduct.findOne({
            where: { IID: IID, SID: SID },
            transaction: t,
          });

          if (!storeProduct) {
            throw new Error(`${productName} product removed by admin.`);
          }

          const newStock = storeProduct.storeStock - orderQty;
          await storeProduct.update({ storeStock: newStock }, { transaction: t });
        }
      });

      order.isAccepted = true;
      order.orderStatus = "Accepted";
      order.acceptTime = new Date();
    }
    if (isPacked) {
      order.isPacked = true;
      order.orderStatus = "Packed";
      order.packedTime = new Date();

      if(order?.isCollect === true) {
        const duration = moment.duration(
          moment(order.packedTime).diff(moment(order.acceptTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.S1 = `${hours} hours : ${minutes} minutes`;
        order.QP = `${hours} hours ${minutes} minutes`;
      }

      if (invoice && !invoiceData) {
        invoiceData = await Invoice.create({
          invoiceNo: invoice?.invoiceNo,
          invoiceAmount: invoice?.invoiceAmount,
          paymentType: invoice?.paymentType,
          OID: OID,
        });
      }
    }

    if(isCollected) {
      order.isCollected = true;
      order.orderStatus = "Collected";
      order.collectedTime = new Date();

      let balanceDosageTime;
      const currentDate = moment();
      if (order.balanceDosagePercentage === 100) {
        // Set to 1 week
        balanceDosageTime = currentDate.add(1, 'week').toDate();
      } else if (order.balanceDosagePercentage < 100) {
        // Set to 1 month
        balanceDosageTime = currentDate.add(1, 'month').toDate();
      }
      order.balanceDosageTime = balanceDosageTime;
      if(invoice) {
        invoiceData = await Invoice.findOne({
          where: { IVID: invoice?.IVID }
        })
        await invoiceData.update(invoice)
      }

      await createDoctorMargin(
        orderData.OID,
        orderData.DID,
        orderData?.orderProducts
      );
    }

    if (isDispatched) {
      order.isDispatched = true;
      order.orderStatus = "Dispatched";
      order.dispatchTime = new Date();
      if(order?.isClinic === true || order?.isAddress === true) {
        const duration = moment.duration(
          moment(order.dispatchTime).diff(moment(order.acceptTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.S1 = `${hours} hours : ${minutes} minutes`;
      }

      const duration = moment.duration(
        moment(order.dispatchTime).diff(moment(order.acceptTime))
      );
      const hours = duration.asHours().toFixed(0);
      const minutes = duration.minutes();
      order.QD = `${hours} hours ${minutes} minutes`;

      if(invoice) {
        invoiceData = await Invoice.findOne({
          where: { IVID: invoice?.IVID }
        })
        await invoiceData.update(invoice)
      }
    }

    if (isDelivered) {
      order.isDelivered = true;
      order.orderStatus = "Delivered";
      order.deliveredTime = new Date();

      if(order?.isClinic === true || order?.isAddress === true) {
        const duration = moment.duration(
          moment(order.deliveredTime).diff(moment(order.dispatchTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.S2 = `${hours} hours : ${minutes} minutes`;
      } else if(order?.isCollect === true) {
        const duration = moment.duration(
          moment(order.collectedTime).diff(moment(order.packedTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.S2 = `${hours} hours : ${minutes} minutes`;
        order.PC = `${hours} hours ${minutes} minutes`; // Calculate PC (Packed to Delivered Time)
      }

      let balanceDosageTime;
      const currentDate = moment();
      if (order.balanceDosagePercentage === 100) {
        // Set to 1 week
        balanceDosageTime = currentDate.add(1, 'week').toDate();
      } else if (order.balanceDosagePercentage < 100) {
        // Set to 1 month
        balanceDosageTime = currentDate.add(1, 'month').toDate();
      }
      order.balanceDosageTime = balanceDosageTime;

      if (order.dispatchTime) {
        // Calculate DC (Dispatch to Delivered Time)
        const duration = moment.duration(
          moment(order.deliveredTime).diff(moment(order.dispatchTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.DC = `${hours} hours ${minutes} minutes`;
      }

      if (order.acceptTime) {
        // Calculate ET (Accept to Delivered Time)
        const duration = moment.duration(
          moment(order.deliveredTime).diff(moment(order.acceptTime))
        );
        const hours = duration.asHours().toFixed(0);
        const minutes = duration.minutes();
        order.ET = `${hours} hours ${minutes} minutes`;
      }

      if(invoice) {
        invoiceData = await Invoice.findOne({
          where: { IVID: invoice?.IVID }
        })
        await invoiceData.update(invoice)
      }

      await createDoctorMargin(
        orderData.OID,
        orderData.DID,
        orderData?.orderProducts
      );
    }

    const notificationMessage = {
      title: order.OID,
      body: order.orderStatus,
      data: {
        OID: order.OID,
        DID: order.DID,
        orderStatus: order.orderStatus,
      }
    };

    if(doctor.fcmToken && doctor.fcmToken.length > 0) {
      sendDoctorNotification(doctor.fcmToken, notificationMessage);
    }
    await order.save();

    // if (invoiceData !== null) {
    //   return res.status(200).json({
    //     message: "Order status updated and invoice created successfully",
    //     invoiceData,
    //   });
    // } else {
    //   return res
    //     .status(200)
    //     .json({ message: "Order status updated successfully" });
    // }
    const responseData = {
      message: "Order status updated successfully",
      invoiceData: invoiceData || null,
      QD: order.QD,
      DC: order.DC,
      QP: order.QP,
      PC: order.PC,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    if (error.message.includes("product removed by admin.")) {
      return res.status(400).json({ message: error?.message });
    }
    return res.status(500).json({ message: error?.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const OID = req.params.id;
  const { cancelReason } = req.body;

  try {
    const order = await Order.findOne({ where: { OID }, include: [OrderProduct] });
    const doctor = await Doctor.findOne({
      where: { DID: order.DID },
      attributes: ['fcmToken'],
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Order already canceled" });
    }

    if (order.orderProducts && order.orderProducts.length > 0 && order.orderStatus) {
      const caseStatements = order.orderProducts.map(
        product => `WHEN "IID" = '${product.IID}' AND "SID" = '${product.SID}' THEN "storeStock" + ${product.orderQty}`
      );

      const ids = order.orderProducts.map(
        product => `("IID" = '${product.IID}' AND "SID" = '${product.SID}')`
      );

      const query = `
        UPDATE "storeProducts"
        SET "storeStock" = CASE 
          ${caseStatements.join(' ')}
        END
        WHERE ${ids.join(' OR ')}
      `;
      await sequelize.query(query);
    }
    
    // order.isAccepted = false;
    // order.isPacked = false;
    // order.isDispatched = false;
    // order.isDelivered = false;
    order.isCancelled = true;
    order.orderStatus = "Cancelled";
    if (cancelReason) {
      order.cancelReason = cancelReason;
    }

    await order.save();
    
    const notificationMessage = {
      title: order.OID,
      body: order.orderStatus,
      data: {
        OID: order.OID,
        DID: order.DID,
        orderStatus: order.orderStatus,
      }
    };

    if(doctor.fcmToken && doctor.fcmToken.length > 0) {
      sendDoctorNotification(doctor.fcmToken, notificationMessage);
    }

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
      include: [{ model: PatientAddress }, { model: Order }],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.trackOrder = async (req, res)  => {
  try{
    const OID = req.params.id;
    const order = await Order.findOne({
      where: { OID },
      include: [
        { model: Contact },
        { model: PatientDetails },
        { model: Doctor, include: [{ model: PersonalInfo }] },
        { model: OrderProduct },
        { model: Invoice },
        { model: Billing }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}