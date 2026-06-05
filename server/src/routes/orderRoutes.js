import { Router } from "express";
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

// ✅ Webhook didaftarkan di app.js langsung — hapus dari sini
// agar tidak konflik dengan POST "/" dan bebas dari middleware apapun

// ✅ Create order
router.post(
  "/",
  sanitizeBody,
  checkBounds({
    buyer_name: { min: 2, max: 100 },
    buyer_email: { min: 5, max: 254 },
    buyer_phone: { min: 8, max: 20 },
    buyer_address: { min: 10, max: 500 },
  }),
  createOrder,
);

// ✅ Public routes
router.get("/track/:orderNumber", trackOrder);
router.post("/:orderNumber/repay", repayOrder);

// ✅ Admin routes
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
