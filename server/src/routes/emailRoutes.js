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
  getRecipients,
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

// Broadcasts — static routes HARUS sebelum dynamic :id routes
router.get("/broadcasts", getBroadcasts);
router.post("/broadcasts", createBroadcast);
router.get("/broadcasts/recipients", getRecipients); // ✅ static, pindah ke atas
router.put("/broadcasts/:id", updateBroadcast); // ✅ dynamic di bawah
router.delete("/broadcasts/:id", deleteBroadcast);
router.post("/broadcasts/:id/send", sendBroadcast);

export default router;
