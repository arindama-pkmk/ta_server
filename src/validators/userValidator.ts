// src/validators/userValidator.ts
import { z } from 'zod';

export const createUserValidationSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const updateUserValidationSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
});
