// src/validators/budgetValidator.ts
import { z } from 'zod';

// For PSPEC 3.1 & 3.4: Creating/Updating a Period
export const periodSchema = z.object({
    startDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid startDate format for period");
    }, z.date()),
    endDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        throw new Error("Invalid endDate format for period");
    }, z.date()),
    periodType: z.enum(['income', 'expense', 'general_evaluation']), // Ensure these match your usage
    description: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"], // Point error to endDate field
});


// For PSPEC 3.3: Client sends selected income subcategories to calculate total budgetable income
export const calculateBudgetableIncomeSchema = z.object({
    periodId: z.string().uuid("Valid period ID is required"),
    selectedSubcategoryIds: z.array(z.string().uuid()).min(1, "At least one subcategory must be selected"),
});


// For PSPEC 3.5, 3.6, 3.7: Client sends chosen expense allocations
// This matches CreateExpenseBudgetAllocationsDto in TransactionBudgetingService
const singleAllocationDetailSchema = z.object({
    categoryId: z.string().uuid("Valid category ID is required"),
    percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
    selectedSubcategoryIds: z.array(z.string().uuid()).min(1, "At least one subcategory must be selected for an allocated category"),
});

export const saveExpenseAllocationsSchema = z.object({
    budgetPeriodId: z.string().uuid("Valid budget period ID is required"),
    totalBudgetableIncome: z.number().min(0, "Total budgetable income cannot be negative"),
    allocations: z.array(singleAllocationDetailSchema)
        // Custom validation for sum of percentages if needed at schema level,
        // though service-level validation is also good.
        .refine(allocs => {
            if (allocs.length === 0) return true; // No allocations, no percentage sum to check
            const totalPercentage = allocs.reduce((sum, alloc) => sum + alloc.percentage, 0);
            // Allow for small floating point discrepancies
            return Math.abs(totalPercentage - 100) < 0.01 || totalPercentage === 0;
        }, { message: "Total percentage for all allocated categories must sum up to 100% (or be 0 if no categories are allocated budget)." })
});