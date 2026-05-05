import { Router } from "express";
import {
  createOrder,
  trackOrder,
  handleMidtransWebhook,
  getAllOrders,
  getOrderById,
  repayOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post("/webhook", handleMidtransWebhook);
router.post("/", createOrder);
router.get("/track/:orderNumber", trackOrder);
router.post("/:orderNumber/repay", repayOrder);
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

export default router;
