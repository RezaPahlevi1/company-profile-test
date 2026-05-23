import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { handleMidtransWebhook } from "./controllers/orderController.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import pageBuilderRoutes from "./routes/pageBuilderRoutes.js";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

// ✅ Trust proxy — aktif di production agar req.ip dan x-forwarded-for
// terbaca dengan benar saat di belakang reverse proxy (Nginx, Render, Railway, dll)
// Nilai "1" artinya percaya satu layer proxy di depan Express
// Jangan aktifkan di development — req.ip akan tetap ::1 (lokal)
if (!isDev) {
  app.set("trust proxy", 1);
}

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

// ✅ CORS
const allowedOrigins = process.env.CLIENT_URL
  ? [
      process.env.CLIENT_URL,
      // ✅ Saat development, izinkan juga port preview (4173)
      ...(process.env.NODE_ENV !== "production"
        ? ["http://localhost:4173", "http://localhost:5173"]
        : []),
    ]
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ✅ Webhook Midtrans — sebelum rate limiter
app.post("/api/orders/webhook", handleMidtransWebhook);
app.post("/api/midtrans/webhook", handleMidtransWebhook);

// ✅ Rate limit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  skip: (req) => req.method === "GET" && req.path === "/api/auth/me",
});
app.use(globalLimiter);

// ✅ Login — anti brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again in 15 minutes.",
  },
});
app.use("/api/auth/login", authLimiter);

// ✅ Create order
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many orders, please try again later.",
  },
  skip: (req) => req.method === "GET" || req.path.includes("webhook"),
});
app.use("/api/orders", orderCreateLimiter);

// ✅ Broadcast
const broadcastSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many broadcast attempts, please try again later.",
  },
  skip: (req) => req.method === "GET",
});
app.use("/api/email/broadcasts", broadcastSendLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/admins", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/page-builder", pageBuilderRoutes);

if (isDev) {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
  });
});

export default app;
