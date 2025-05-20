// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validateZod = <T>(schema: ZodSchema<T>): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ errors: error.errors });
                return; // Stop further processing
            }
            next(error);
        }
    };
};
