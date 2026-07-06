import { Router } from "express";
import {
  getLegalPage,
  updateLegalPage,
} from "../controllers/legalController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { sanitizeBodyExclude, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

// Public
router.get("/:key", getLegalPage);

// Superadmin only — "content" dikecualikan dari whitespace-collapsing generik
// karena berisi HTML terformat Tiptap; sanitasi XSS sesungguhnya terjadi
// di controller lewat sanitizeRichText (allowlist tag, sama seperti blog)
router.put(
  "/:key",
  authMiddleware,
  requireRole("superadmin"),
  sanitizeBodyExclude(["content"]),
  checkBounds({ title: { min: 1, max: 150 } }),
  updateLegalPage,
);

export default router;
