// src/validators/userValidator.ts
import { z } from 'zod';

export const createUserValidationSchema = z.object({ // Used for admin create or generic user create
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    address: z.string().min(1, 'Address is required'),
    occupationId: z.string().uuid("Valid occupation ID is required"), // Assuming client sends ID
    // occupationName: z.string().min(1, "Occupation name is required"), // Or if client sends name
    birthdate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid birthdate format");
    }, z.date()),
});

// Specific schema for user registration endpoint
export const registerUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    address: z.string().min(1, 'Address is required'),
    occupationId: z.string().uuid("Valid occupation ID is required"), // Or occupationName if backend resolves it
    birthdate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid birthdate format");
    }, z.date()),
});


export const loginUserSchema = z.object({
    email: z.string().email('Invalid email format (or username)'), // Or use a more generic 'identifier'
    password: z.string().min(1, 'Password is required'),
});

export const updateUserProfileSchema = z.object({ // For user updating their own profile
    name: z.string().min(1).optional(),
    username: z.string().min(3).optional(),
    // email: z.string().email().optional(), // Email change might need verification
    address: z.string().min(1).optional(),
    occupationId: z.string().uuid().optional(),
    birthdate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        return undefined;
    }, z.date().optional()),
    // Password change should be a separate endpoint with currentPassword validation
});