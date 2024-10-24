const express = require("express");
const { getRent, getRentOfDoctor, getOrdersOfDoctor } = require("../controllers/rentController");
const { verifyToken, isAdminOrDoctor, isAdmin } = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/get-rent", getRent);
router.post("/get/:id", [verifyToken, isAdminOrDoctor], getRentOfDoctor)
router.post("/get-orders/:id", [verifyToken, isAdmin], getOrdersOfDoctor)

module.exports = router;