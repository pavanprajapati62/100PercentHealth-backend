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
  getAllOrdersOfDoctor,
} = require("../controllers/doctorController");
const {
  verifyToken,
  isAdmin,
  isDoctor,
  isAdminOrDoctor,
  isStoreOrDoctor,
  iAdminOrStoreOrDoctor,
} = require("../middlewares/roleMiddleware");

router.post("/", [verifyToken, isAdmin], createDoctor);
router.get("/", [verifyToken, isAdmin], getAllDoctors);
router.get("/get-all-patients", [verifyToken, isDoctor], getAllPatients);
router.get("/get-doctor-detail", [verifyToken, isDoctor], getDoctorDetail);
router.get('/get-orders-doctor', [verifyToken, isDoctor], getAllOrdersOfDoctor)
router.get("/search-doctor", searchDoctor);
router.get("/get-billing-detail", [verifyToken, isStoreOrDoctor], getBillingDetails);
router.get("/get-products-frequent/:id", [verifyToken, iAdminOrStoreOrDoctor], getFrequentProducts)
router.get("/:id", [verifyToken, isAdminOrDoctor], getDoctorById);
router.put("/:id", [verifyToken, isAdminOrDoctor], updateDoctor);
router.delete("/:id", [verifyToken, isAdmin], deleteDoctor);
router.patch("/update-doctor-status", [verifyToken, isDoctor], updateDoctorStatus);
router.post("/add-products-frequent", [verifyToken, isDoctor], addProductsToFrequent);
router.delete("/remove-products-frequent/:id", [verifyToken, isDoctor], removeFrequentProduct)

module.exports = router;
