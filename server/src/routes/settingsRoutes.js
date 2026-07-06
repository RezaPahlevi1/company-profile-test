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
import { sanitizeBody, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

// Public
router.get("/site", getSiteSettings);
router.get("/pages", getPageSettings);

// Superadmin only
router.put(
  "/site",
  authMiddleware,
  requireRole("superadmin"),
  sanitizeBody,
  checkBounds({
    site_name: { max: 100 },
    site_description: { max: 500 },
    delivery_estimation: { max: 100 },
    footer_tagline: { max: 200 },
    footer_cta_title: { max: 100 },
    footer_cta_body: { max: 300 },
    // footer_video_url tidak di-checkBounds — divalidasi via extractYoutubeId di controller
    terms_highlight: { max: 250 },
  }),
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
  sanitizeBody,
  checkBounds({
    title: { min: 1, max: 100 },
    navbar_label: { min: 1, max: 50 },
  }),
  updatePageSetting,
);

export default router;
