"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecurityMiddleware = createSecurityMiddleware;
// Floria API — Security Middleware (Helmet + Security Headers)
const helmet_1 = __importDefault(require("helmet"));
function createSecurityMiddleware() {
    return [
        (0, helmet_1.default)({
            contentSecurityPolicy: false, // REST API server doesn't render HTML
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
        (_req, res, next) => {
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            if (process.env.NODE_ENV === "production") {
                res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            }
            next();
        },
    ];
}
