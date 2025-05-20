// src/validators/evaluationValidator.ts
import { z } from 'zod';

// For PSPEC 4.2: Requesting calculation for a period
export const calculateEvaluationsSchema = z.object({
    // periodId: z.string().uuid("Valid period ID is required"),
    // ratioCodes: z.array(z.string()).optional(), // If you implement selective calculation
});

// For creating/updating EvaluationResult if client sends pre-calculated value (less ideal)
// If server calculates, this schema might not be needed for create.
export const evaluationResultSchema = z.object({
    periodId: z.string().uuid(),
    ratioId: z.string().uuid(),
    value: z.number(),
    // status: z.nativeEnum(EvaluationStatus), // If status is sent by client
    // userId is from token
});