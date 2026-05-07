import { Router } from "express";
import {
  getTemplates,
  getTemplate,
  updateTemplate,
  resetTemplate,
  getBroadcasts,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  getRecipientPreview,
  sendBroadcast,
} from "../controllers/emailController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("superadmin"));

// Templates
router.get("/templates", getTemplates);
router.get("/templates/:key", getTemplate);
router.put("/templates/:key", updateTemplate);
router.post("/templates/:key/reset", resetTemplate);

// Broadcasts
router.get("/broadcasts", getBroadcasts);
router.post("/broadcasts", createBroadcast);
router.put("/broadcasts/:id", updateBroadcast);
router.delete("/broadcasts/:id", deleteBroadcast);
router.get("/broadcasts/recipients/preview", getRecipientPreview);
router.post("/broadcasts/:id/send", sendBroadcast);

export default router;
