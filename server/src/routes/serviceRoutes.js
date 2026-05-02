import { Router } from "express";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.post("/", authMiddleware, upload.single("image"), createService);
router.put("/:id", authMiddleware, upload.single("image"), updateService);
router.delete("/:id", authMiddleware, deleteService);

export default router;
