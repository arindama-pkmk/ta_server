// src/validators/transactionValidator.ts
import { z } from 'zod';

export const createTransactionSchema = z.object({
    description: z.string().min(1, "Description is required"),
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid date format for transaction");
    }, z.date()),
    subcategoryId: z.string().uuid("Valid subcategory ID is required"),
    amount: z.number().positive("Amount must be a positive number"),
    isBookmarked: z.boolean().optional(), // Optional, defaults in DB
});

export const updateTransactionSchema = z.object({
    description: z.string().min(1).optional(),
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        return undefined;
    }, z.date().optional()),
    subcategoryId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    isBookmarked: z.boolean().optional(),
});