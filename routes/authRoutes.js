const express = require("express");
const {
  doctorLogin,
  storeLogin,
  adminLogin,
  adminSignUp,
  getAdminDetail,
} = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/doctor/login", doctorLogin);
router.post("/store/login", storeLogin);
router.post("/admin/signup", adminSignUp);
router.post("/admin/login", adminLogin);
router.get("/admin/get-admin-detail", [verifyToken, isAdmin], getAdminDetail);

module.exports = router;
