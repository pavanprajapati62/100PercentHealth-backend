const express = require("express");
const router = express.Router();
const {
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
  getAllPatients,
  searchDoctor,
  getDoctorDetail,
  getBillingDetails,
  updateDoctorStatus,
  addProductsToFrequent,
  getFrequentProducts,
  removeFrequentProduct,
} = require("../controllers/doctorController");
const {
  verifyToken,
  isAdmin,
  isDoctor,
  isAdminOrDoctor,
} = require("../middlewares/roleMiddleware");

router.post("/", [verifyToken, isAdmin], createDoctor);
router.get("/", [verifyToken, isAdmin], getAllDoctors);
router.get("/get-all-patients", [verifyToken, isDoctor], getAllPatients);
router.get("/get-doctor-detail", [verifyToken, isDoctor], getDoctorDetail);
router.get("/search-doctor", searchDoctor);
router.get("/get-billing-detail", [verifyToken, isDoctor], getBillingDetails);
router.get("/get-products-frequent", [verifyToken, isDoctor], getFrequentProducts)
router.get("/:id", [verifyToken, isAdminOrDoctor], getDoctorById);
router.put("/:id", [verifyToken, isAdminOrDoctor], updateDoctor);
router.delete("/:id", [verifyToken, isAdmin], deleteDoctor);
router.patch("/update-doctor-status", [verifyToken, isDoctor], updateDoctorStatus);
router.post("/add-products-frequent", [verifyToken, isDoctor], addProductsToFrequent);
router.delete("/remove-products-frequent/:id", [verifyToken, isDoctor], removeFrequentProduct)

module.exports = router;
