// src/validators/evaluationValidator.ts
import { z } from 'zod';

export const calculateEvaluationsSchema = z.object({
    // periodId: z.string().uuid("Valid period ID is required"), // REMOVED
    startDate: z.preprocess((arg) => { // ADDED
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid startDate format for evaluation");
    }, z.date()),
    endDate: z.preprocess((arg) => { // ADDED
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid endDate format for evaluation");
    }, z.date()),
    // ratioCodes: z.array(z.string()).optional(),
}).refine(data => data.endDate >= data.startDate, { // ADDED top-level date validation
    message: "End date cannot be before start date for evaluation",
    path: ["endDate"],
});

// evaluationResultSchema might not be needed if client doesn't send pre-calculated values.
// If it were used for creating an EvaluationResult, it would also need startDate/endDate.