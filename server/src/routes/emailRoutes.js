import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  uploadBroadcastImage,
} from "../controllers/emailController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import {
  sanitizeBody,
  sanitizeBodyExclude,
  checkBounds,
} from "../middlewares/sanitize.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

const isDev = process.env.NODE_ENV !== "production";

const broadcastSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many broadcast attempts, please try again later.",
  },
});

router.use(authMiddleware);
router.use(requireRole("superadmin"));

// Templates
router.get("/templates", getTemplates);
router.get("/templates/:key", getTemplate);
router.put(
  "/templates/:key",
  sanitizeBody,
  checkBounds({
    subject: { max: 200 }, // ← hapus min:3
    greeting: { max: 200 },
    body_message: { max: 5000 },
    footer_text: { max: 500 },
  }),
  updateTemplate,
);
router.post("/templates/:key/reset", resetTemplate);

// Broadcasts — static routes sebelum dynamic :id
router.get("/broadcasts", getBroadcasts);
router.post(
  "/broadcasts",
  sanitizeBodyExclude(["body_message"]),
  checkBounds({
    subject: { min: 3, max: 200 },
    // body_message adalah HTML dari Tiptap
    body_message: { min: 1, max: 100000 },
  }),
  createBroadcast,
);
router.get("/broadcasts/recipients", getRecipients);

// ✅ Upload inline image untuk broadcast editor — hanya superadmin (sudah di-cover router.use di atas)
router.post(
  "/broadcasts/upload-image",
  upload.single("image"),
  uploadBroadcastImage,
);

router.put(
  "/broadcasts/:id",
  sanitizeBodyExclude(["body_message"]),
  checkBounds({
    subject: { min: 3, max: 200 },
    body_message: { min: 1, max: 100000 },
  }),
  updateBroadcast,
);
router.delete("/broadcasts/:id", deleteBroadcast);
router.post("/broadcasts/:id/send", broadcastSendLimiter, sendBroadcast);

export default router;
