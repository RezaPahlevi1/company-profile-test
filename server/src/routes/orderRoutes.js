import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createOrder,
  trackOrder,
  handleMidtransWebhook,
  getAllOrders,
  getOrderById,
  repayOrder,
  updateOrderStatus,
  updateFulfillment,
} from "../controllers/orderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { sanitizeBody, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

// ✅ Rate limiter untuk mencegah spam bot pada endpoint publik
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // Maksimal 20 request per 15 menit per IP
  message: {
    success: false,
    message: "Terlalu banyak request dari IP ini, silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Create order (dilindungi sanitize, checkBounds, dan rateLimit)
router.post(
  "/",
  publicLimiter,
  sanitizeBody,
  checkBounds({
    buyer_name: { min: 2, max: 100 },
    buyer_email: { min: 5, max: 254 },
    buyer_phone: { min: 8, max: 20 },
    buyer_address: { min: 10, max: 500 },
  }),
  createOrder,
);

// ✅ Public routes (dilindungi rateLimit)
router.get("/track/:orderNumber", publicLimiter, trackOrder);
router.post("/:orderNumber/repay", publicLimiter, repayOrder);

// ✅ Admin routes (tidak perlu publicLimiter, sudah pakai authMiddleware)
router.get(
  "/",
  authMiddleware,
  requireRole("superadmin", "admin_order"),
  getAllOrders,
);
router.get(
  "/:id",
  authMiddleware,
  requireRole("superadmin", "admin_order"),
  getOrderById,
);
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("superadmin", "admin_order"),
  updateOrderStatus,
);

// ✅ Update fulfillment status — superadmin + admin_order
router.patch(
  "/:id/fulfillment",
  authMiddleware,
  requireRole("superadmin", "admin_order"),
  updateFulfillment,
);

export default router;
