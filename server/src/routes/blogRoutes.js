import { Router } from "express";
import {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllCategories,
  createCategory,
  deleteCategory,
  getAllTags,
  createTag,
  deleteTag,
} from "../controllers/blogController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { sanitizeBody, checkBounds } from "../middlewares/sanitize.js";

const router = Router();

// ✅ Static routes HARUS sebelum dynamic /:id atau /:slug
// Categories
router.get("/categories", getAllCategories);
router.post(
  "/categories",
  authMiddleware,
  requireRole("superadmin", "admin_konten"),
  sanitizeBody,
  checkBounds({ name: { min: 1, max: 50 } }),
  createCategory,
);
router.delete(
  "/categories/:id",
  authMiddleware,
  requireRole("superadmin"), // ✅ hanya superadmin
  deleteCategory,
);

// Tags
router.get("/tags", getAllTags);
router.post(
  "/tags",
  authMiddleware,
  requireRole("superadmin", "admin_konten"),
  sanitizeBody,
  checkBounds({ name: { min: 1, max: 50 } }),
  createTag,
);
router.delete(
  "/tags/:id",
  authMiddleware,
  requireRole("superadmin"), // ✅ hanya superadmin
  deleteTag,
);

// Blogs
router.get("/", getAllBlogs);
router.get("/id/:id", getBlogById);
router.get("/:slug", getBlogBySlug);
router.post(
  "/",
  authMiddleware,
  requireRole("superadmin", "admin_konten"),
  upload.single("cover_image"),
  sanitizeBody,
  checkBounds({ title: { min: 1, max: 200 } }),
  createBlog,
);
router.put(
  "/:id",
  authMiddleware,
  requireRole("superadmin", "admin_konten"),
  upload.single("cover_image"),
  sanitizeBody,
  checkBounds({ title: { min: 1, max: 200 } }),
  updateBlog,
);
router.delete(
  "/:id",
  authMiddleware,
  requireRole("superadmin", "admin_konten"),
  deleteBlog,
);

export default router;
