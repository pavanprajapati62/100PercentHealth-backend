const Doctor = require("../models/Doctor/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const Store = require("../models/Store/Store");
const Admin = require("../models/Admin");
const Order = require("../models/Order/Order");
const PatientDetails = require("../models/Order/PatientDetails");
const { Op } = require("sequelize");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const PatientAddress = require("../models/Order/Adress");

exports.adminSignUp = async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res
        .status(400)
        .send({ message: "Username and PIN are required." });
    }

    const existingUser = await Admin.findOne({ where: { username } });
    if(existingUser) {
      return res.status(400).json({ message: "Username already exist" });
    }

    const user = await authService.signUp(username, pin);
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

    const token = await authService.login(username, pin);

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};

exports.doctorLogin = async (req, res) => {
  const { contactNumber, pin } = req.body;

  try {
    if(contactNumber === "" || pin === "" ) {
      return res.status(404).json({ message: "Provide credential" });
    }

    const doctor = await Doctor.findOne({ where: { contactNumber } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let isMatchPin = await bcrypt.compare(pin, doctor.pin);

    let isMatchPinB = await bcrypt.compare(pin, doctor.pinB);

    if (isMatchPinB) {
      doctor.is_pin_b = true;
      await doctor.save();
    }

    if (isMatchPin && !isMatchPinB) {
      doctor.is_pin_b = false;
      await doctor.save();
    }

    if (!isMatchPin && !isMatchPinB) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    doctor.currentDoctorStatus = "ACTIVE"
    await doctor.save();

    const token = jwt.sign(
      { DID: doctor.DID, role: doctor.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      status: doctor.currentDoctorStatus,
      isPinB: doctor.is_pin_b,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.storeLogin = async (req, res) => {
  const { username, pin } = req.body;

  try {
    const store = await Store.findOne({ where: { username } });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const isMatch = await bcrypt.compare(pin, store.pin);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    store.currentStoreStatus = "ACTIVE"
    await store.save();

    const token = jwt.sign(
      { SID: store.SID, role: store.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      status: store.currentStoreStatus,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
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

    if (searchQuery.startsWith("DID")) {
      const doctorResult = await Doctor.findAndCountAll({
        where: {
          DID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          { model: PersonalInfo },
          { model: Order, include: [{ model: PatientDetails }] },
          { model: PatientDetails },
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = doctorResult.rows;
      count = doctorResult.count;
    }

    if (searchQuery.startsWith("OID")) {
      const orderResult = await Order.findAndCountAll({
        where: {
          OID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          {
            model: Doctor,
            include: [{ model: PersonalInfo }],
          },
          {
            model: PatientDetails,
          },
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = orderResult.rows;
      count = orderResult.count;
    }

    if (searchQuery.startsWith("PID")) {
      const patientResult = await PatientDetails.findAndCountAll({
        where: {
          PID: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        include: [
          {
            model: Doctor,
            include: [{ model: PersonalInfo }],
          },
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        limit,
        offset,
      });
      result = patientResult.rows;
      count = patientResult.count;
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
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(phoneResult || []);
    } else {

      if (searchQuery.startsWith("PID")) {
        const patientResult = await PatientDetails.findAndCountAll({
          where: {
            PID: {
              [Op.iLike]: `%${searchQuery}%`,
            },
          },
          include: [{ model: PatientAddress }, { model: Order }],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });
        result = patientResult.rows;
        count = patientResult.count;
      } else if (searchQuery.startsWith("SID")) {
        const storeResult = await Store.findAndCountAll({
          where: {
            [Op.or]: [
              { title: { [Op.iLike]: `%${searchQuery}%` } },
              { username: { [Op.iLike]: `%${searchQuery}%` } },
              { SID: { [Op.iLike]: `%${searchQuery}%` } },
            ],
          },
          include: [
            {
              model: Order,
              include: [
                { model: PatientDetails, include: [{ model: PatientAddress }] },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
          distinct: true,
          limit,
          offset,
        });
        result = storeResult.rows;
        count = storeResult.count;
      } else {
        const nameResult = await PatientDetails.findAndCountAll({
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchQuery}%` } },
              { surname: { [Op.iLike]: `%${searchQuery}%` } },
            ],
          },
          include: [{ model: PatientAddress }, { model: Order }],
          order: [["createdAt", "DESC"]],
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
      order: [["createdAt", "DESC"]],
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
