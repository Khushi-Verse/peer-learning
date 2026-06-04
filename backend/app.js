import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routers/chatRoutes.js";
import aiRoutes from "./routers/aiRoutes.js";
import matchRoutes from "./routers/matchRoutes.js";
import authRoutes from "./routers/authRoutes.js";
import cronRoutes from "./routers/cronRoutes.js";
import notificationRoutes from "./routers/notificationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// SECURITY: Only trust proxy headers when explicitly configured.
// Set TRUST_PROXY=true for simple single-hop proxies (e.g., Heroku, Render).
// Set TRUSTED_PROXIES="10.0.0.0/8,172.16.0.0/12" for explicit subnet whitelisting (recommended).
// When neither is set, req.ip always returns the raw socket address, preventing X-Forwarded-For spoofing.
if (process.env.TRUSTED_PROXIES) {
  app.set("trust proxy", process.env.TRUSTED_PROXIES.split(",").map(s => s.trim()));
  console.log(`[security] trust proxy enabled for subnets: ${process.env.TRUSTED_PROXIES}`);
} else if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
  console.warn("[security] trust proxy enabled with hop-count 1. Consider setting TRUSTED_PROXIES for explicit subnet whitelisting.");
}

// SECURITY: Build a strict CORS origin whitelist.
// - FRONTEND_URL can be a single URL or comma-separated list (e.g., "https://app.example.com,https://staging.example.com").
// - In production, the server refuses to start if FRONTEND_URL is missing.
// - In development, it defaults to common localhost origins for convenience.
const ALLOWED_ORIGINS = process.env.FRONTEND_URL;

if (!ALLOWED_ORIGINS) {
  console.error('❌ FRONTEND_URL environment variable is required');
  process.exit(1);
}

app.use(cors({
  origin: ALLOWED_ORIGINS.split(',').map(url => url.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Cap incoming JSON body size to 100 KB so a single oversized request
// cannot exhaust server memory or cause a denial-of-service condition.
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
