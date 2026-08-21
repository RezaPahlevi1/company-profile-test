import { Router } from "express";
import {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", getAllBrands);
router.post(
  "/",
  authMiddleware,
  requireRole("superadmin"),
  upload.single("image"),
  createBrand,
);
router.put(
  "/:id",
  authMiddleware,
  requireRole("superadmin"),
  upload.single("image"),
  updateBrand,
);
router.delete("/:id", authMiddleware, requireRole("superadmin"), deleteBrand);

export default router;
