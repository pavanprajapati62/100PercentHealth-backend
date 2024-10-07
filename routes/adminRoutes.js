const express = require("express");
const router = express.Router();
const {
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const { verifyToken, isAdmin } = require("../middlewares/roleMiddleware");
const { createStore } = require("../controllers/storeController");

// Admin routes for managing doctors
router.post("/doctor/create", [verifyToken, isAdmin], createDoctor);
router.get("/doctor/getAll", [verifyToken, isAdmin], getAllDoctors);
router.get("/doctor/:id", [verifyToken, isAdmin], getDoctorById);
router.put("/doctor/:id", [verifyToken, isAdmin], updateDoctor);
router.delete("/doctor/:id", [verifyToken, isAdmin], deleteDoctor);

// Admin routes for managing stores
router.post("/store/create", [verifyToken, isAdmin], createStore);

module.exports = router;
