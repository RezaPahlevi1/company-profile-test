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
import { sanitizeBody, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("superadmin"));

// Templates
router.get("/templates", getTemplates);
router.get("/templates/:key", getTemplate);
router.put(
  "/templates/:key",
  sanitizeBody,
  checkBounds({
    subject: { min: 3, max: 200 },
    greeting: { min: 2, max: 200 },
    body_message: { min: 10, max: 5000 },
    footer_text: { max: 500 },
  }),
  updateTemplate,
);
router.post("/templates/:key/reset", resetTemplate);

// Broadcasts — static routes sebelum dynamic :id
router.get("/broadcasts", getBroadcasts);
router.post(
  "/broadcasts",
  sanitizeBody,
  checkBounds({
    subject: { min: 3, max: 200 },
    body_message: { min: 10, max: 5000 },
  }),
  createBroadcast,
);
router.get("/broadcasts/recipients", getRecipients);
router.put(
  "/broadcasts/:id",
  sanitizeBody,
  checkBounds({
    subject: { min: 3, max: 200 },
    body_message: { min: 10, max: 5000 },
  }),
  updateBroadcast,
);
router.delete("/broadcasts/:id", deleteBroadcast);
router.post("/broadcasts/:id/send", sendBroadcast);

export default router;
