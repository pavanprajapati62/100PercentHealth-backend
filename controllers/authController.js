const Doctor = require("../models/Doctor/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const Store = require("../models/Store/Store");
const Admin = require("../models/Admin");
const Order = require("../models/Order/Order");
const PatientDetails = require("../models/Order/PatientDetails");
const OrderProduct = require("../models/Order/Product");
const { Op, fn, col } = require("sequelize");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const PatientAddress = require("../models/Order/Adress");
const DoctorPublishRecord = require("../models/Doctor/DoctorPublishRecord");
const DoctorOrderMargins = require("../models/Doctor/DoctorOrderMargins");
const Invoice = require("../models/Order/Invoice");
const { sequelize } = require("../config/db");
const DoctorRent = require("../models/Rent/DoctorRent");
const { sendDoctorNotification } = require("../config/firebase");

exports.adminSignUp = async (req, res) => {
  try {
    const { username, pin } = req.body;
    const lowerCaseUsername = username.toLowerCase().trim();
    if (!lowerCaseUsername || !pin) {
      return res
        .status(400)
        .send({ message: "Username and PIN are required." });
    }

    const existingUser = await Admin.findOne({ where: { username: lowerCaseUsername } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exist" });
    }

    const user = await authService.signUp(lowerCaseUsername, pin);
    res.status(201).send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res
        .status(400)
        .send({ message: "Username and PIN are required." });
    }
    const lowerCaseUsername = username.toLowerCase().trim();

    const { token, refreshToken } = await authService.login(lowerCaseUsername, pin);

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    let decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if(decoded?.DID) {
      var newToken = jwt.sign(
        { DID: decoded?.DID, role: decoded?.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
  
      var newRefreshToken = jwt.sign(
        { DID: decoded?.DID, role: decoded?.role },
        process.env.JWT_SECRET
      );
    } else if(decoded?.SID) {
      var newToken = jwt.sign(
        { DID: decoded?.SID, role: decoded?.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
  
      var newRefreshToken = jwt.sign(
        { DID: decoded?.DID, role: decoded?.role },
        process.env.JWT_SECRET
      );
    } else {
      var newToken = jwt.sign(
        { id: decoded?.id, role: decoded?.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
  
      var newRefreshToken = jwt.sign(
        { id: decoded?.id, role: decoded?.role },
        process.env.JWT_SECRET
      );
    }

    res.status(200).json({
      message: "Refresh token generated successfully",
      newToken: newToken,
      newRefreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
}

exports.doctorLogin = async (req, res) => {
  const { contactNumber, pin, fcmToken } = req.body;

  try {
    if (contactNumber === "" || pin === "") {
      return res.status(404).json({ message: "Provide credential" });
    }

    const doctor = await Doctor.findOne({ where: { contactNumber } });
    if (!doctor) {
      return res.status(404).json({ message: "Contact number is wrong" });
    }

    if (doctor.pin) {
      var decodedPin = jwt.verify(doctor.pin, process.env.JWT_SECRET);
    }
    if (doctor.pinB) {
      var decodedPinB = jwt.verify(doctor.pinB, process.env.JWT_SECRET);
    }

    let isMatchPinB = false;
    if (decodedPinB?.pinB === pin) {
      isMatchPinB = true;
      doctor.is_pin_b = true;
      await doctor.save();
    }

    let isMatchPin = false;
    if (decodedPin?.pin === pin && !isMatchPinB) {
      isMatchPin = true;
      doctor.is_pin_b = false;
      await doctor.save();
    }

    if (!isMatchPin && !isMatchPinB) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (fcmToken !== null && fcmToken !== undefined) {
      if (!doctor.fcmToken.includes(fcmToken)) {
        doctor.fcmToken.push(fcmToken);
        doctor.changed('fcmToken', true);
        await doctor.save();
      }
    }

    doctor.currentDoctorStatus = "ACTIVE";
    await doctor.save();

    const token = jwt.sign(
      { DID: doctor.DID, role: doctor.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const refreshToken = jwt.sign(
      { DID: doctor.DID, role: doctor.role },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      status: doctor.currentDoctorStatus,
      isPinB: doctor.is_pin_b,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.storeLogin = async (req, res) => {
  const { username, pin, fcmToken } = req.body;

  try {
    const store = await Store.findOne({ where: { username: username.toLowerCase().trim() } });
    const doctors = await Doctor.findAll({
      where: { SID: store.SID },
      attributes: ['fcmToken'],
    });

    if (!store) {
      return res.status(404).json({ message: "Username not found" });
    }

    // const isMatch = await bcrypt.compare(pin, store.pin);
    let isMatch = false;
    const decodedPin = jwt.verify(store.pin, process.env.JWT_SECRET);
    if (decodedPin.pin === pin) {
      isMatch = true;
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (fcmToken !== null && fcmToken !== undefined) {
      if (!store.fcmToken.includes(fcmToken)) {
        store.fcmToken.push(fcmToken);
        store.changed('fcmToken', true);
        await store.save();
      }
    }

    store.currentStoreStatus = "ACTIVE";
    await store.save();

    const token = jwt.sign(
      { SID: store.SID, role: store.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const refreshToken = jwt.sign(
      { SID: store.SID, role: store.role },
      process.env.JWT_SECRET
    );

    const fcmTokens = [];
    doctors.forEach((doctor) => {
      if (doctor.dataValues.fcmToken) {
        fcmTokens.push(...doctor.dataValues.fcmToken);
      }
    });

    const notificationMessage = {
      title: store.title,
      body: store.currentStoreStatus,
      data: {
        storeName: store.title,
        status: store.currentStoreStatus,
      }
    };
    if(fcmTokens && fcmTokens.length > 0) {
      sendDoctorNotification(fcmTokens, notificationMessage);
    }
    return res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      status: store.currentStoreStatus,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getAdminDetail = async (req, res) => {
  const id = req.userId;
  try {
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchOrderData = async (req, res) => {
  const searchQuery = req.query.search;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let result = [];
    let count = 0;

    if (searchQuery.startsWith("D")) {
      const doctorResult = await Order.findAndCountAll({
        where: {
          DID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          { model: Doctor, include: [{ model: PersonalInfo }] },
          { model: PatientDetails },
          { model: DoctorOrderMargins },
          { model: Invoice },
          { model: OrderProduct }
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = doctorResult.rows;
      count = doctorResult.count;
    } else if (searchQuery.startsWith("P")) {
      const patientResult = await Order.findAndCountAll({
        where: {
          PID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          { model: Doctor, include: [{ model: PersonalInfo }] },
          { model: PatientDetails },
          { model: DoctorOrderMargins },
          { model: Invoice },
          { model: OrderProduct }
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = patientResult.rows;
      count = patientResult.count;
    } else {
      const orderResult = await Order.findAndCountAll({
        where: {
          OID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          { model: Doctor, include: [{ model: PersonalInfo }] },
          { model: PatientDetails },
          { model: DoctorOrderMargins },
          { model: Invoice },
          { model: OrderProduct }
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = orderResult.rows;
      count = orderResult.count;
    }
    
    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Need to change
exports.searchCustomerData = async (req, res) => {
  const searchQuery = req.query.search;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let result = [];
    let count = 0;

    if (/^\d+$/.test(searchQuery)) {
      const phoneResult = await PatientDetails.findAll({
        where: {
          phoneNumber: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [{ model: PatientAddress }, { model: Order }],
        order: [["name", "ASC"]],
      });
      res.status(200).json(phoneResult || []);
    } else {
      if (/^p/i.test(searchQuery)) {
        const patientResult = await PatientDetails.findAndCountAll({
          where: {
            PID: {
              [Op.iLike]: `%${searchQuery}%`,
            },
          },
          include: [{ model: PatientAddress }, { model: Order }],
          order: [["name", "ASC"]],
          distinct: true,
          limit,
          offset,
        });
        result = patientResult.rows;
        count = patientResult.count;
      } else if (/^s/i.test(searchQuery)) {
        const storeResult = await Order.findAndCountAll({
          where: {
            [Op.or]: [
              { SID: { [Op.iLike]: `%${searchQuery}%` } },
            ],
          },
          include: [
            {
              model: PatientDetails,
              order: [['name', 'ASC']],
              // include: [
              //   { model: PatientDetails, include: [{ model: PatientAddress }] },
              // ],
            },
          ],
          group: ['order.SID', 'patientDetail.id', 'order.addressType', "order.premisesNoFloor", "order.premisesName", "order.landmark", 
            "order.areaRoad", "order.city", "order.pincode", "order.state", "order.phoneNumber2",], 
          attributes: {
            include: ['SID', 'addressType'],
            exclude: ["OID", "isClinic", "isCollect", "isAddress", "payment", "prescription", "orderStatus", "isAccepted", "isPacked", "isCollected",
              "isDispatched", "isDelivered", "isCancelled", "cancelReason", "doctorName", "filePath", "pdfPath", "acceptTime", "packedTime", 
              "collectedTime", "dispatchTime", "deliveredTime", "QP", "QD", "PC", "DC", "ET", "S1", "S2", "isOrderEdited", 
              "balanceDosagePercentage", 
              "balanceDosageTime", "updatedAt", "DID", "createdAt", "PID", "isPublishedRecord"
            ]
          },
          // order: [["createdAt", "DESC"]],
          distinct: true,
          limit,
          offset,
          order: [[PatientDetails, 'name', 'ASC']],
        });
        const flattenedResult = storeResult.rows.map(order => {
          const { patientDetail, ...orderData } = order.dataValues;
          return {
            ...orderData,
            patientDetail,
            name: patientDetail ? patientDetail.name : null,
            surname: patientDetail ? patientDetail.surname : null,
          };
        });
        
        storeResult.rows = flattenedResult;
        result = storeResult.rows;
        count = storeResult.count.length;
      } else {
        const nameResult = await PatientDetails.findAndCountAll({
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchQuery}%` } },
              { surname: { [Op.iLike]: `%${searchQuery}%` } },
            ],
          },
          include: [{ model: PatientAddress }, { model: Order }],
          order: [["name", "ASC"]],
          distinct: true,
          limit,
          offset,
        });
        result = nameResult.rows;
        count = nameResult.count;
      }

      res.status(200).json({
        currentPage: page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPatients = async (req, res) => {
  const searchQuery = req.query.search || "";
  const page = parseInt(req?.query?.page) || 1;
  const limit = parseInt(req?.query?.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let result = [];
    let count = 0;
    const patientResult = await PatientDetails.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { surname: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      include: [{ model: Order }, { model: PatientAddress }],
      distinct: true,
      order: [["name", "ASC"]],
      limit,
      offset,
    });
    result = patientResult.rows;
    count = patientResult.count;

    res.status(200).json({
      currentPage: page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.publishRecord = async (req, res) => {
  try {
    const { id } = req.body;
    const findRecord = await DoctorPublishRecord.findByPk(id) 

    console.log("findRecord", findRecord)
    if(findRecord) {
      delete req?.body?.id
      const [updated] = await DoctorPublishRecord.update(req.body, {
        where: { id }, 
        returning: true, 
      });
      
      if (updated) {
        const updatedRecord = await DoctorPublishRecord.findOne({ where: { id } });
        return res.status(200).json({ message: "Record updated successfully", data: updatedRecord });
      } else {
        return res.status(404).json({ message: "Record not found or update failed" });
      }

    } else {
      const data = await DoctorPublishRecord.create(req.body);
      return res.status(200).json({ message: "Record created successfully", data: data });

    }

    // const doctorRent = await DoctorRent.findOne({
    //   where: { DID, month: month, year: year },
    // })
    // if(doctorRent) {
    //   await doctorRent.update({
    //     isPublished: true,
    //   })
    // }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.errors ? error?.errors[0]?.message : error.message });
  }
};

exports.getAllPublishRecords = async (req, res) => {
  try {
    const records = await DoctorPublishRecord.findAll();

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

exports.updatePublishRecord = async (req, res) => {
  try {
    const id = req.params.id;
    const { period, DID } = req.body;
    if(period) {
      var [month, year] = period.split(" ");
    }

    const doctorRentData = await DoctorRent.findOne({
      where: {
        DID: DID,
        month: month,
        year: year,
      },
    });

    if (!doctorRentData) {
      return res.status(404).json({ error: "No Record Found" });
    }

    if(doctorRentData?.isPublished === true) {
      return res.status(400).json({ error: "Record already published" });
    }

    let publishRecord = await DoctorPublishRecord.findOne({
      where: { id: id },
    });

    if(!publishRecord) {
      throw new Error("Publish record not found")
    }

    await publishRecord.update(req.body);

    console.log("DID", DID)
    const doctorRent = await DoctorRent.findOne({
      where: { DID, month: month, year: year },
    })
    if(doctorRent) {
      await doctorRent.update({
        isPublished: true,
      })
    }

    res.status(200).json({ message: "Publish record updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
