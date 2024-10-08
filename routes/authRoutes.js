const express = require("express");
const {
  doctorLogin,
  storeLogin,
  adminLogin,
  adminSignUp,
  getAdminDetail,
  searchOrderData,
  searchCustomerData,
  getAllPatients,
} = require("../controllers/authController");
const { verifyToken, isAdmin, isAdminOrDoctor } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/doctor/login", doctorLogin);
router.post("/store/login", storeLogin);
router.post("/admin/signup", adminSignUp);
router.post("/admin/login", adminLogin);
router.get("/admin/get-admin-detail", [verifyToken, isAdmin], getAdminDetail);
router.get("/search-order-data", searchOrderData)
router.get("/search-customer-data", searchCustomerData)
router.get("/get-all-patients", [verifyToken, isAdminOrDoctor], getAllPatients);

module.exports = router;
