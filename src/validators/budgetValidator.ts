// src/validators/budgetValidator.ts
import { z } from 'zod';

// Removed periodSchema

const singleAllocationDetailSchema = z.object({
    categoryId: z.string().uuid("Valid category ID is required"),
    percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
    selectedSubcategoryIds: z.array(z.string().uuid()).min(1, "At least one subcategory must be selected for an allocated category"),
});

export const saveExpenseAllocationsSchema = z.object({
    // Fields for BudgetPlan
    planStartDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid planStartDate format");
    }, z.date()),
    planEndDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid planEndDate format");
    }, z.date()),
    incomeCalculationStartDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid incomeCalculationStartDate format");
    }, z.date()),
    incomeCalculationEndDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid incomeCalculationEndDate format");
    }, z.date()),
    totalCalculatedIncome: z.number().min(0, "Total calculated income cannot be negative"),

    // Allocations array
    allocations: z.array(singleAllocationDetailSchema)
        .refine(allocs => {
            if (allocs.length === 0) return true;
            const totalPercentage = allocs.reduce((sum, alloc) => sum + alloc.percentage, 0);
            return Math.abs(totalPercentage - 100) < 0.01 || totalPercentage === 0;
        }, { message: "Total percentage for all allocated categories must sum up to 100% (or be 0 if no categories are allocated)." })
}).refine(data => data.planEndDate >= data.planStartDate, {
    message: "Budget plan end date cannot be before start date",
    path: ["planEndDate"],
}).refine(data => data.incomeCalculationEndDate >= data.incomeCalculationStartDate, {
    message: "Income calculation end date cannot be before start date",
    path: ["incomeCalculationEndDate"],
});

// Schema for fetching allocations (now uses dates instead of periodId)
export const getAllocationsForPlanSchema = z.object({
    planStartDate: z.preprocess((arg) => new Date(arg as string), z.date()),
    planEndDate: z.preprocess((arg) => new Date(arg as string), z.date()),
});

// Schema for income summary (now uses dates instead of periodId)
export const getIncomeSummaryForDatesSchema = z.object({
    startDate: z.preprocess((arg) => new Date(arg as string), z.date()),
    endDate: z.preprocess((arg) => new Date(arg as string), z.date()),
});