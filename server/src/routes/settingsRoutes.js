import { Router } from "express";
import {
  getSiteSettings,
  updateSiteSettings,
  uploadLogo,
  deleteLogo,
  getPageSettings,
  updatePageSetting,
} from "../controllers/settingsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

// Public — dibutuhkan Navbar dan halaman publik
router.get("/site", getSiteSettings);
router.get("/pages", getPageSettings);

// Superadmin only
router.put(
  "/site",
  authMiddleware,
  requireRole("superadmin"),
  updateSiteSettings,
);
router.post(
  "/logo",
  authMiddleware,
  requireRole("superadmin"),
  upload.single("logo"),
  uploadLogo,
);
router.delete("/logo", authMiddleware, requireRole("superadmin"), deleteLogo);
router.put(
  "/pages/:key",
  authMiddleware,
  requireRole("superadmin"),
  updatePageSetting,
);

export default router;
