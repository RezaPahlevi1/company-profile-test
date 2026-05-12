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

const app = express();

// ✅ Compression — paling atas sebelum semua middleware
app.use(compression());

// ✅ Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// ✅ CORS
// Di production: CLIENT_URL di .env diisi satu domain → hanya itu yang diallow
// Di development: allow 5173 (dev) dan 4173 (vite preview) sekaligus
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests tanpa origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ✅ Body size limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ✅ Webhook Midtrans — HARUS sebelum rate limiter
app.post("/api/orders/webhook", handleMidtransWebhook);
app.post("/api/midtrans/webhook", handleMidtransWebhook);

// ✅ Rate limit global — 200 request per 15 menit per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

// ✅ Login — anti brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
  max: 20,
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
  max: 10,
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

// ✅ Health check — development only
if (process.env.NODE_ENV !== "production") {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
}

// ✅ Error handler
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
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

export default app;
