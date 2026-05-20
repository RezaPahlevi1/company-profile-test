import { Router } from "express";
import { getActivePromos } from "../controllers/promoController.js";
import {
  getPromoSettings,
  updatePromoSettings,
  uploadPromoBanner,
  deletePromoBanner,
} from "../controllers/settingsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { sanitizeBody, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

// Public — dipakai PromoPopup dan komponen publik
router.get("/", getActivePromos);

// Superadmin only — kelola kampanye promo
router.get(
  "/settings",
  authMiddleware,
  requireRole("superadmin"),
  getPromoSettings,
);

router.put(
  "/settings",
  authMiddleware,
  requireRole("superadmin"),
  sanitizeBody,
  checkBounds({
    promo_title: { max: 100 },
    promo_description: { max: 300 },
  }),
  updatePromoSettings,
);

router.post(
  "/banner",
  authMiddleware,
  requireRole("superadmin"),
  upload.single("promo_banner"),
  uploadPromoBanner,
);

router.delete(
  "/banner",
  authMiddleware,
  requireRole("superadmin"),
  deletePromoBanner,
);

export default router;
