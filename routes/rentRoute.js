const express = require("express");
const { getRent, getRentOfDoctor, getOrdersOfDoctor, testGenerateMonthlyRent, createCsvOrdersOfDoctor } = require("../controllers/rentController");
const { verifyToken, isAdminOrDoctor, isAdmin } = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/get-rent", getRent);
router.post("/get/:id", [verifyToken, isAdminOrDoctor], getRentOfDoctor)
router.post("/get-orders/:id", [verifyToken, isAdmin], getOrdersOfDoctor)
router.post("/test-generate", [verifyToken, isAdmin], testGenerateMonthlyRent)
router.post("/create-csv/:id", [verifyToken, isAdmin], createCsvOrdersOfDoctor)



module.exports = router;