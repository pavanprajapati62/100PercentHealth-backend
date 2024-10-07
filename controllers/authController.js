const Doctor = require("../models/Doctor/Doctor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const Store = require("../models/Store/Store");
const Admin = require("../models/Admin");

exports.adminSignUp = async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res
        .status(400)
        .send({ message: "Username and PIN are required." });
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
    // Check if doctor exists
    const doctor = await Doctor.findOne({ where: { contactNumber } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if the pin matches
    const isMatch = await bcrypt.compare(pin, doctor.pin);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { DID: doctor.DID, role: doctor.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.storeLogin = async (req, res) => {
  const { username, pin } = req.body;

  try {
    // Check if store exists
    const store = await Store.findOne({ where: { username } });
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Check if the pin matches
    const isMatch = await bcrypt.compare(pin, store.pin);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { SID: store.SID, role: store.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
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
