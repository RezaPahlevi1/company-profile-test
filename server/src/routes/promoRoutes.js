import { Router } from "express";
import { getActivePromos } from "../controllers/promoController.js";

const router = Router();

router.get("/", getActivePromos);

export default router;
