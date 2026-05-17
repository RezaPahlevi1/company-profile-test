import { Router } from "express";
import {
  getPageConfig,
  updatePageConfig,
} from "../controllers/pageBuilderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

// GET — public, tidak perlu auth (halaman publik butuh config ini)
router.get("/:pageKey", getPageConfig);

// PUT — hanya superadmin
router.put("/:pageKey", authMiddleware, requireRole("superadmin"), updatePageConfig);

export default router;