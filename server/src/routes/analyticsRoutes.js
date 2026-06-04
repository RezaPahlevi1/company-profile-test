import { Router } from "express";
import {
  trackVisit,
  getAnalytics,
  getSalesAnalytics,
} from "../controllers/analyticsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post("/track", trackVisit);
router.get("/summary", authMiddleware, requireRole("superadmin"), getAnalytics);
router.get(
  "/sales",
  authMiddleware,
  requireRole("superadmin"),
  getSalesAnalytics,
);

export default router;
