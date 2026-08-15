// Floria API — CORS Security Middleware
import cors, { CorsOptions } from "cors";
import { getEnv } from "../config/env.js";

export function createCorsMiddleware() {
  const env = getEnv();

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Flutter, curl, Postman)
      if (!origin) return callback(null, true);

      if (env.NODE_ENV === "development") {
        return callback(null, true);
      }

      if (
        env.CORS_ALLOWED_ORIGINS.includes(origin) ||
        env.CORS_ALLOWED_ORIGINS.includes("*") ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS] Rejected unlisted origin: '${origin}'`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    maxAge: 86400, // 24 hours preflight cache
  };

  return cors(corsOptions);
}
