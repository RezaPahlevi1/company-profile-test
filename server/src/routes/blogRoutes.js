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

const router = Router();

router.get("/categories", getAllCategories);
router.post("/categories", authMiddleware, requireRole('superadmin', 'admin_konten'), createCategory);

router.get("/tags", getAllTags);
router.post("/tags", authMiddleware, requireRole('superadmin', 'admin_konten'), createTag);

router.get("/", getAllBlogs);
router.get("/id/:id", getBlogById);
router.get("/:slug", getBlogBySlug);
router.post("/", authMiddleware, requireRole('superadmin', 'admin_konten'), upload.single("cover_image"), createBlog);
router.put("/:id", authMiddleware, requireRole('superadmin', 'admin_konten'), upload.single("cover_image"), updateBlog);
router.delete("/:id", authMiddleware, requireRole('superadmin', 'admin_konten'), deleteBlog);
router.delete("/categories/:id", authMiddleware, requireRole('superadmin'), deleteCategory);
router.delete("/tags/:id", authMiddleware, requireRole('superadmin'), deleteTag);

export default router;
