// src/types/auth.d.ts
import { Request } from 'express';

export interface JwtPayload { // Or use existing type from jwt library if it matches
    id: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthRequest extends Request {
    user: JwtPayload; // Reflects the actual decoded token
}