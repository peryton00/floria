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

      const isLanOrLocal =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);

      const isFloriaDomain =
        origin === "https://floriaa-web.vercel.app" ||
        origin === "https://floria-seller-web.vercel.app" ||
        origin === "https://floria-admin-web.vercel.app" ||
        origin === "https://floria-web.vercel.app" ||
        /^https:\/\/floria[a-z0-9-]*\.vercel\.app$/.test(origin) ||
        /^https:\/\/floria[a-z0-9-]*\.onrender\.com$/.test(origin);

      if (
        env.CORS_ALLOWED_ORIGINS.includes(origin) ||
        isFloriaDomain ||
        isLanOrLocal
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS] Rejected unlisted origin: '${origin}'`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    maxAge: 86400, // 24 hours preflight cache
  };

  return cors(corsOptions);
}
