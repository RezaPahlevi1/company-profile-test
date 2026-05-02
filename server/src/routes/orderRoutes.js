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

const router = Router();

router.post("/webhook", handleMidtransWebhook);
router.post("/", createOrder);
router.get("/track/:orderNumber", trackOrder);
router.post("/:orderNumber/repay", repayOrder);
router.get("/", authMiddleware, getAllOrders);
router.get("/:id", authMiddleware, getOrderById);
router.patch("/:id/status", authMiddleware, updateOrderStatus);

export default router;
