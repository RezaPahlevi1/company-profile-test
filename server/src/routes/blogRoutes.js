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
  getAllTags,
  createTag,
} from "../controllers/blogController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/categories", getAllCategories);
router.post("/categories", authMiddleware, createCategory);

router.get("/tags", getAllTags);
router.post("/tags", authMiddleware, createTag);

router.get("/", getAllBlogs);
router.get("/id/:id", getBlogById);
router.get("/:slug", getBlogBySlug);
router.post("/", authMiddleware, upload.single("cover_image"), createBlog);
router.put("/:id", authMiddleware, upload.single("cover_image"), updateBlog);
router.delete("/:id", authMiddleware, deleteBlog);

export default router;
