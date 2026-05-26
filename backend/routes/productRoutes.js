import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Admin-only product modification routes
router.post("/products", protect, restrictTo("admin"), createProduct);
router.put("/products/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/products/:id", protect, restrictTo("admin"), deleteProduct);

export default router;
