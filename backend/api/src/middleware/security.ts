// Floria API — Security Middleware (Helmet + Security Headers)
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

export function createSecurityMiddleware() {
  return [
    helmet({
      contentSecurityPolicy: false, // REST API server doesn't render HTML
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
    (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      if (process.env.NODE_ENV === "production") {
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains",
        );
      }
      next();
    },
  ];
}
