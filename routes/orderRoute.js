const express = require("express");
const {
  createOrder,
  getOrderById,
  uploadImage,
  updateOrder,
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const upload = require("../middlewares/uploadImage");
const { verifyToken, isStoreOrDoctor } = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/", [verifyToken, isStoreOrDoctor], createOrder);
router.post("/uploadImage", upload.single("image"), uploadImage);
router.get("/all", [verifyToken], getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id", [verifyToken, isStoreOrDoctor], updateOrder);
router.delete("/:id", deleteOrder);
router.patch("/:id", updateOrderStatus);
router.patch("/cancel/:id", cancelOrder);

module.exports = router;
