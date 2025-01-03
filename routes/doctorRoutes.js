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
  getFrequentProductsV1,
  removeFrequentProduct,
  getAllOrdersOfDoctor,
  createPdf,
  getPublishRecordForDoctor,
} = require("../controllers/doctorController");
const {
  verifyToken,
  isAdmin,
  isDoctor,
  isAdminOrDoctor,
  isStoreOrDoctor,
  isAdminOrStoreOrDoctor,
} = require("../middlewares/roleMiddleware");

router.post("/", [verifyToken, isAdmin], createDoctor);
router.get("/", [verifyToken, isAdmin], getAllDoctors);
router.get("/get-all-patients", [verifyToken, isDoctor], getAllPatients);
router.get("/get-doctor-detail", [verifyToken, isDoctor], getDoctorDetail);
router.get('/get-orders-doctor', [verifyToken, isDoctor], getAllOrdersOfDoctor)
router.get("/get-publish-record/:id", [verifyToken, isAdminOrDoctor], getPublishRecordForDoctor);
router.get("/search-doctor", searchDoctor);
router.get("/get-billing-detail", [verifyToken, isStoreOrDoctor], getBillingDetails);
router.get("/get-products-frequent/:id", [verifyToken, isAdminOrStoreOrDoctor], getFrequentProducts)
router.get("/get-products-frequent-v1/:id", [verifyToken, isAdminOrStoreOrDoctor], getFrequentProductsV1)
router.get("/:id", [verifyToken, isAdminOrDoctor], getDoctorById);
router.put("/:id", [verifyToken, isAdminOrDoctor], updateDoctor);
router.delete("/:id", [verifyToken, isAdmin], deleteDoctor);
router.patch("/update-doctor-status", [verifyToken, isDoctor], updateDoctorStatus);
router.post("/add-products-frequent", [verifyToken, isDoctor], addProductsToFrequent);
router.post("/create-pdf", [verifyToken, isAdminOrStoreOrDoctor], createPdf);
router.delete("/remove-products-frequent/:id", [verifyToken, isDoctor], removeFrequentProduct)

module.exports = router;
