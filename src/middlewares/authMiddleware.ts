import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';


/**
 * Middleware to authenticate requests using JWT.
 *
 * @param {Request} req - The Express request object, which should contain the Authorization header with a Bearer token.
 * @param {Response} res - The Express response object used to send an unauthorized response if authentication fails.
 * @param {NextFunction} next - The next middleware function in the Express stack, called if authentication succeeds.
 *
 * This middleware checks for the presence of an Authorization header, extracts the token,
 * and verifies it using the JWT_SECRET environment variable. If the token is valid, it
 * attaches the decoded token to the request object and proceeds to the next middleware.
 * If the token is missing, malformed, or invalid, it responds with a 401 Unauthorized error.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    // Expecting a header in the format "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Unauthorized: Malformed token' });
        return;
    }

    try {
        // Verify token using your secret (ensure process.env.JWT_SECRET is set)
        const decoded = jwt.verify(token, loadEnvironmentVariable('JWT_SECRET'));
        // Optionally, attach the decoded token to the request for later use
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
        return;
    }
};
