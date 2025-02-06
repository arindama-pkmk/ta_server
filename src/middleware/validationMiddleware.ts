// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, ZodSchema } from 'zod';

/**
 * Middleware to validate request bodies using a Zod schema.
 *
 * @template T - The type inferred from the provided Zod schema.
 * @param {ZodSchema<T>} schema - The Zod schema to validate the request body against.
 * @returns {RequestHandler} - An Express request handler that validates the request body.
 *
 * This middleware attempts to parse and validate the request body using the provided Zod schema.
 * If the validation succeeds, it calls the next middleware or route handler.
 * If the validation fails with a ZodError, it sends a 400 status code with the validation errors.
 * Any other errors are passed to the default error handler.
 */
export const validateZod = <T>(schema: ZodSchema<T>): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ errors: error.errors });
            }
            next(error);
        }
    };
};
