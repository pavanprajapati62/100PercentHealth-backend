const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProduct,
  searchDrug,
} = require("../controllers/productController");
const { verifyToken, isAdmin, isStoreOrAdmin } = require("../middlewares/roleMiddleware");

// Admin routes for managing products stock

router.get("/search-product", searchProduct);
router.get("/search-drug", searchDrug);
router.post("/create", [verifyToken, isAdmin], createProduct);
router.get("/all", [verifyToken, isStoreOrAdmin], getAllProducts);
router.get("/:id", [verifyToken, isAdmin], getProductById);
router.put("/:id", [verifyToken, isStoreOrAdmin], updateProduct); 
router.delete("/:id", [verifyToken, isStoreOrAdmin], deleteProduct); 

module.exports = router;
