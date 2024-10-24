const Doctor = require("../models/Doctor/Doctor");
const Compliances = require("../models/Doctor/Compliances");
const AccountCategory = require("../models/Doctor/AccountCategory");
const PersonalInfo = require("../models/Doctor/PersonalInfo");
const ClinicAddress = require("../models/Doctor/ClinicAddress");
const EmailInfo = require("../models/Doctor/EmailInfo");
const PaymentDetails = require("../models/Doctor/PaymentDetails");
const PatientDetails = require("../models/Order/PatientDetails");
const { Op } = require("sequelize");
const Store = require("../models/Store/Store");
const Order = require("../models/Order/Order");
const StoreBillingDetail = require("../models/Store/StoreBillingDetail");
const PatientAddress = require("../models/Order/Adress");
const Product = require("../models/Product/Product");
const FrequentProducts = require("../models/Doctor/FrequentProducts");
const Address = require("../models/Store/Address");
const jwt = require("jsonwebtoken");
const Billing = require("../models/Order/Billing");
const OrderProduct = require("../models/Order/Product");

exports.createDoctor = async (req, res) => {
  try {
    const {
      doctorDetails,
      compliances,
      accountCategory,
      personalInfo,
      clinicAddress,
      emailInfo,
      paymentDetails,
    } = req.body;

    // Create doctor
    const doctor = await Doctor.create(doctorDetails);
    const doctorDID = doctor.DID;

    if (!doctorDID) {
      throw new Error("Failed to generate DID for the doctor.");
    }

    // Create associated records
    await Compliances.create({ ...compliances, DID: doctorDID });
    await AccountCategory.create({ ...accountCategory, DID: doctorDID });
    await PersonalInfo.create({ ...personalInfo, DID: doctorDID });
    await ClinicAddress.create({ ...clinicAddress, DID: doctorDID });
    await EmailInfo.create({ ...emailInfo, DID: doctorDID });
    await PaymentDetails.create({ ...paymentDetails, DID: doctorDID });

    res
      .status(201)
      .json({ message: "Doctor and related details created successfully." });
  } catch (err) {
    console.error("Error creating doctor:", err);
    // res
    //   .status(500)
    //   .json({ error: "Failed to create doctor and related details." });
    res.status(500).json({ error: err });
  }
};

// Get All Doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [
        Compliances,
        AccountCategory,
        PersonalInfo,
        ClinicAddress,
        EmailInfo,
        PaymentDetails,
        Order,
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error getting all doctors:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Doctor By ID
exports.getDoctorById = async (req, res) => {
  try {
    const DID = req?.params?.id;
    const doctor = await Doctor.findOne({
      where: { DID },
      include: [
        Compliances,
        AccountCategory,
        PersonalInfo,
        ClinicAddress,
        EmailInfo,
        PaymentDetails,
        Order,
      ],
    });
    console.log("doctor", doctor.pin)
    try {
      const decodedPin = jwt.verify(doctor.pin, process.env.JWT_SECRET);
      plainPin = decodedPin?.pin;
      const decodedPinB = jwt.verify(doctor.pinB, process.env.JWT_SECRET);
      plainPinB = decodedPinB?.pinB;
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
    doctor.pin = plainPin;
    doctor.pinB = plainPinB;
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Doctor
exports.updateDoctor = async (req, res) => {
  try {
    const DID = req?.params?.id;
    const {
      doctorDetails,
      compliances,
      accountCategory,
      personalInfo,
      clinicAddress,
      emailInfo,
      paymentDetails,
    } = req.body;

    const doctor = await Doctor.findOne({
      where: { DID },
    });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    if (doctorDetails?.pin) {
      var decodedPin = jwt.sign({ pin: doctorDetails.pin}, process.env.JWT_SECRET);
      doctorDetails.pin = decodedPin;
    }
    if (doctorDetails?.pinB) {
      var decodedPinB = jwt.sign({ pinB : doctorDetails.pinB}, process.env.JWT_SECRET);
      doctorDetails.pinB = decodedPinB;
    }

    await doctor.update(doctorDetails);
    await Compliances.update(compliances, { where: { DID } });
    await AccountCategory.update(accountCategory, { where: { DID } });
    await PersonalInfo.update(personalInfo, { where: { DID } });
    await ClinicAddress.update(clinicAddress, { where: { DID } });
    await EmailInfo.update(emailInfo, { where: { DID } });
    await PaymentDetails.update(paymentDetails, { where: { DID } });

    res.status(200).json({ message: "Doctor updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Doctor (DELETE request)
exports.deleteDoctor = async (req, res) => {
  const DID = req.params.id;
  try {
    const doctor = await Doctor.destroy({
      where: { DID: DID },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await Doctor.destroy({ where: { DID } });
    await Compliances.destroy({ where: { DID } });
    await AccountCategory.destroy({ where: { DID } });
    await PersonalInfo.destroy({ where: { DID } });
    await ClinicAddress.destroy({ where: { DID } });
    await EmailInfo.destroy({ where: { DID } });
    await PaymentDetails.destroy({ where: { DID } });

    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchDoctor = async (req, res) => {
  const searchQuery = req.query.search || "";

  try {
    const doctors = await Doctor.findAll({
      include: [
        {
          model: PersonalInfo,
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${searchQuery}%` } },
              { surname: { [Op.iLike]: `%${searchQuery}%` } },
            ],
          },
        },
        {
          model: ClinicAddress,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(doctors || []);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

exports.getAllPatients = async (req, res) => {
  const doctorId = req.userId;
  const searchQuery = req.query.search || "";

  try {
    const patients = await PatientDetails.findAll({
      where: {
        DID: doctorId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { surname: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      include: [{ model: Order }, { model: PatientAddress }],
    });

    res.status(200).json(patients || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

function decryptPin(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.pin;
  } catch (err) {
    console.error("Invalid token:", err.message);
    return null;
  }
}

exports.getDoctorDetail = async (req, res) => {
  const DID = req.userId;
  try {
    const doctor = await Doctor.findOne({
      where: { DID: DID },
      include: [PersonalInfo],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // const decryptedPin = decryptPin(doctor.pin);
    // const decryptedPinB = decryptPin(doctor.pinB);

    const lastOrder = await Order.findOne({
      where: { DID: DID },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    res.status(200).json({ doctor, lastOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBillingDetails = async (req, res) => {
  const id = req.userId;
  try {
    const doctor = await Doctor.findOne({
      where: { DID: id },
    });

    if (id.startsWith("DID")) {
      var store = await Store.findOne({
        where: { SID: doctor.SID },
      });
    } else {
      var store = await Store.findOne({
        where: { SID: id },
      });
    }
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const storeBillingDetail = await StoreBillingDetail.findOne({
      where: { SID: store.SID },
      include: [{ model: Store, include: [{ model: Address }] }],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(storeBillingDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const DID = req.userId;
    const { currentDoctorStatus } = req.body;

    const doctor = await Doctor.findOne({ where: { DID: DID } });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.currentDoctorStatus = currentDoctorStatus;

    await doctor.update({ currentDoctorStatus });

    res.status(200).json({ message: "Doctor status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addProductsToFrequent = async (req, res) => {
  try {
    const DID = req.userId;
    const { IID } = req.body;

    const doctor = await Doctor.findOne({ where: { DID: DID } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const product = await Product.findOne({
      where: { IID: IID },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingFrequentProduct = await FrequentProducts.findOne({
      where: { IID: IID, DID: DID },
    });
    if (!existingFrequentProduct) {
      await FrequentProducts.create({
        IID: product.IID,
        DID: doctor.DID,
        SID: doctor.SID,
      });
    } else {
      return res
        .status(404)
        .json({ error: "Product is already added in frequent" });
    }

    res
      .status(200)
      .json({ message: "Product added in frequent successfullyI" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFrequentProducts = async (req, res) => {
  try {
    // const id = req.userId;
    const id = req.params.id;

    if (id.startsWith("DID")) {
      const doctor = await Doctor.findOne({ where: { DID: id } });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      var frequentProducts = await FrequentProducts.findAll({
        where: { DID: id },
        include: [{ model: Product }],
        order: [["createdAt", "DESC"]],
      });
    } else {
      var frequentProducts = await FrequentProducts.findAll({
        where: { SID: id },
        include: [{ model: Product }],
        order: [["createdAt", "DESC"]],
      });
    }

    res.status(200).json(frequentProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFrequentProduct = async (req, res) => {
  try {
    const IID = req.params.id;

    await FrequentProducts.destroy({
      where: { IID: IID },
    });

    res.status(200).json({ message: "Frequent product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOrdersOfDoctor = async (req, res) => {
  try {
    const DID = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const filter = req.query?.filter || "all";

    let whereClause = {
      DID,
    };
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
