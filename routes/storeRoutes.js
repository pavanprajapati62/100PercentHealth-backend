const express = require("express");
const router = express.Router();
const {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  assignDoctorToStore,
  searchStore,
  getStoreDetail,
  billingStore,
  getDoctorsOfStore,
  getProductsOfStore,
  removeDoctorFromStore,
  getDoctorsNotAssigned,
  updateStoreStatus,
  // getDoctorsByStore,
} = require("../controllers/storeController");
const {
  verifyToken,
  isAdmin,
  isStore,
  isStoreOrDoctor,
} = require("../middlewares/roleMiddleware");

// Admin routes for managing stores

router.post("/create", [verifyToken, isAdmin], createStore);
router.post("/assign-doctors", [verifyToken, isAdmin], assignDoctorToStore);
// router.get("/store/:SID/doctors", [verifyToken, isAdmin], getDoctorsByStore);
router.get("/search-store", searchStore);
router.get("/get-doctors/:id", [verifyToken, isAdmin], getDoctorsOfStore);
router.get("/get-doctors", [verifyToken, isAdmin], getDoctorsNotAssigned);
router.get("/get-products", [verifyToken, isStoreOrDoctor], getProductsOfStore);
router.post("/billing", billingStore);
router.get("/all", [verifyToken, isAdmin], getAllStores);
router.get("/get-store-detail", [verifyToken, isStore], getStoreDetail);
router.get("/:id", [verifyToken, isAdmin], getStoreById);
router.put("/:id", [verifyToken, isAdmin], updateStore);
router.delete("/:id", [verifyToken, isAdmin], deleteStore);
router.delete(
  "/remove-doctor/:id/store/:sid",
  [verifyToken, isAdmin],
  removeDoctorFromStore
);
router.patch("/update-store-status", [verifyToken, isStore], updateStoreStatus);

module.exports = router;
