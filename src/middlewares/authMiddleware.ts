import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';


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
