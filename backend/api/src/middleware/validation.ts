// Floria API — Request Validation Middleware (Zod)
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { Errors } from "../utils/errors.js";

export interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Single validation system using Zod.
 * Validates params, query, and body. Throws formatted VALIDATION_ERROR if invalid.
 */
export function validateRequest(schemas: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return next(Errors.validation(message));
      }
      next(error);
    }
  };
}
