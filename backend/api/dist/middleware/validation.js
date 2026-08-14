"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const errors_js_1 = require("../utils/errors.js");
/**
 * Single validation system using Zod.
 * Validates params, query, and body. Throws formatted VALIDATION_ERROR if invalid.
 */
function validateRequest(schemas) {
    return (req, _res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
                return next(errors_js_1.Errors.validation(message));
            }
            next(error);
        }
    };
}
