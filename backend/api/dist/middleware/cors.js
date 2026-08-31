"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCorsMiddleware = createCorsMiddleware;
// Floria API — CORS Security Middleware
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("../config/env.js");
function createCorsMiddleware() {
    const env = (0, env_js_1.getEnv)();
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, Flutter, curl, Postman)
            if (!origin)
                return callback(null, true);
            if (env.NODE_ENV === "development") {
                return callback(null, true);
            }
            const isLanOrLocal = origin.startsWith("http://localhost:") ||
                origin.startsWith("http://127.0.0.1:") ||
                /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
            if (env.CORS_ALLOWED_ORIGINS.includes(origin) ||
                env.CORS_ALLOWED_ORIGINS.includes("*") ||
                origin.endsWith(".vercel.app") ||
                origin.endsWith(".onrender.com") ||
                isLanOrLocal) {
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
    return (0, cors_1.default)(corsOptions);
}
