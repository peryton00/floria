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
            if (env.CORS_ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed.`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        maxAge: 86400, // 24 hours preflight cache
    };
    return (0, cors_1.default)(corsOptions);
}
