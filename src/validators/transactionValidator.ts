// src/validators/transactionValidator.ts
import { z } from 'zod';

export const createTransactionValidationSchema = z.object({
    type: z.string().min(1, "Type is required"),
    description: z.string().min(1, "Description is required"),
    // Preprocess converts a string (or Date) into a Date object.
    date: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        } else {
            throw new Error("Invalid date format");
        }
    }, z.date()),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    amount: z.number().positive("Amount must be a positive number"),
});
