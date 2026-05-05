import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", authMiddleware, requireRole("superadmin"), upload.single("image"), createProduct);
router.put("/:id", authMiddleware, requireRole("superadmin"), upload.single("image"), updateProduct);
router.delete("/:id", authMiddleware, requireRole("superadmin"), deleteProduct);

export default router;
