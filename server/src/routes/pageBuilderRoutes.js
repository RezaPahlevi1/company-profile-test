import { Router } from "express";
import {
  getPageConfig,
  updatePageConfig,
  uploadHeroImage,
  deleteHeroImage,
} from "../controllers/pageBuilderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

// ─────────────────────────────────────────────
// GET — public, tidak perlu auth
// ─────────────────────────────────────────────
router.get("/:pageKey", getPageConfig);

// ─────────────────────────────────────────────
// PUT — hanya superadmin
// ─────────────────────────────────────────────
router.put(
  "/:pageKey",
  authMiddleware,
  requireRole("superadmin"),
  updatePageConfig,
);

// ─────────────────────────────────────────────
// POST /upload-image — upload satu gambar hero
// Harus di atas /:pageKey agar tidak tertangkap sebagai pageKey
// ─────────────────────────────────────────────
router.post(
  "/upload-image",
  authMiddleware,
  requireRole("superadmin"),
  upload.single("image"),
  uploadHeroImage,
);

// ─────────────────────────────────────────────
// DELETE /delete-image — hapus gambar hero dari storage
// ─────────────────────────────────────────────
router.delete(
  "/delete-image",
  authMiddleware,
  requireRole("superadmin"),
  deleteHeroImage,
);

export default router;
