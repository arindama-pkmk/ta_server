// src/controllers/transactionBudgetingController.ts
import { Response, NextFunction } from 'express';
import { TransactionBudgetingService, SaveExpenseAllocationsClientDto } from '../services/transactionBudgetingService';
// DTOs for individual allocation CRUD might change if they don't make sense without a BudgetPlan context
// For now, assuming they might operate on allocations within an existing plan (identified by budgetPlanId in path/query)
// import { CreateExpenseAllocationDto, UpdateExpenseAllocationDto } from '../repositories/transactionBudgetingRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { AuthRequest } from '../types/auth';
import { BadRequestError, UnauthorizedError } from '../utils/errorHandler';
import { getIncomeSummaryForDatesSchema } from '../validators/budgetValidator';
import { ZodError } from 'zod';

// const getBudgetPlansQuerySchema = z.object({
//     startDate: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : undefined), z.date().optional()),
//     endDate: z.preprocess((arg) => (typeof arg === 'string' ? new Date(arg) : undefined), z.date().optional()),
// });


@injectable()
export class TransactionBudgetingController {
    private readonly budgetingService: TransactionBudgetingService;

    constructor(@inject(TYPES.TransactionBudgetingService) budgetingService: TransactionBudgetingService) {
        this.budgetingService = budgetingService;
    }

    // === BudgetPlan Endpoints ===
    // Example: Get all budget plans for a user (maybe with date filtering)
    async getBudgetPlans(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { startDate, endDate } = req.query; // Optional query params for filtering
            const plans = await this.budgetingService.getBudgetPlansForUser(
                req.user.id,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );
            res.status(200).json({ success: true, data: plans });
        } catch (error) {
            next(error);
        }
    }

    async getBudgetPlanDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { budgetPlanId } = req.params;
            if (!budgetPlanId) throw new BadRequestError("budgetPlanId parameter is required.");
            const plan = await this.budgetingService.getBudgetPlanById(budgetPlanId, req.user.id);
            res.status(200).json({ success: true, data: plan });
        } catch (error) {
            next(error);
        }
    }
    // Add POST for creating a budget plan (if separate from saveExpenseAllocations)
    // Add PUT for updating a budget plan etc.
    // Add DELETE for a budget plan

    // === ExpenseAllocation CRUD (Now relative to a BudgetPlan) ===
    // These might be less used if saveExpenseAllocations handles the bulk creation.
    // Example: Get allocations for a specific budget plan
    async getAllocationsForBudgetPlan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { budgetPlanId } = req.query; // Or from params: /budget-plans/:budgetPlanId/allocations
            if (!budgetPlanId || typeof budgetPlanId !== 'string') {
                return next(new BadRequestError("budgetPlanId query parameter is required."));
            }
            const allocations = await this.budgetingService.getAllocationsForBudgetPlan(budgetPlanId, req.user.id);
            res.status(200).json({ success: true, data: allocations });
        } catch (error) {
            next(error);
        }
    }
    // Individual Allocation CRUD might be removed or adapted to require budgetPlanId context.


    // === Core Budgeting Flow Endpoints ===
    async getIncomeSummaryForDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');

            // Validate query parameters using Zod manually
            const validationResult = getIncomeSummaryForDatesSchema.safeParse(req.query);

            if (!validationResult.success) {
                // ZodError.flatten() provides a nice error structure
                throw new BadRequestError('Invalid query parameters: \n' + JSON.stringify(validationResult.error.flatten().fieldErrors, null, 2));
            }

            const { startDate, endDate } = validationResult.data; // Use validated and coerced dates

            const summary = await this.budgetingService.getSummarizedIncomeForDateRange(
                startDate, endDate, req.user.id
            );
            res.status(200).json({ success: true, data: summary });
        } catch (error) {
            if (error instanceof ZodError) { // Catch ZodError if safeParse isn't used and parse throws
                return next(new BadRequestError('Invalid query parameters: \n' + JSON.stringify(error.flatten().fieldErrors, null, 2)));
            }
            next(error);
        }
    }

    async getExpenseCategorySuggestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        // This remains the same
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const suggestions = await this.budgetingService.getExpenseCategorySuggestions(req.user.id);
            res.status(200).json({ success: true, data: suggestions });
        } catch (error) {
            next(error);
        }
    }

    async saveExpenseAllocations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');

            // Zod validation (saveExpenseAllocationsSchema) now expects startDate, endDate, etc. for the plan
            // The Zod schema itself should handle the transformation if `z.preprocess` is used correctly.
            // Let's assume Zod has already validated and potentially transformed.
            // If Zod doesn't transform, you do it here.

            const rawDto = req.body as SaveExpenseAllocationsClientDto; // This DTO from client has string dates

            // Create a new DTO or modify rawDto for the service, ensuring Date objects
            const serviceDto: SaveExpenseAllocationsClientDto = {
                ...rawDto,
                planStartDate: new Date(rawDto.planStartDate), // Convert to Date
                planEndDate: new Date(rawDto.planEndDate),       // Convert to Date
                incomeCalculationStartDate: new Date(rawDto.incomeCalculationStartDate), // Convert
                incomeCalculationEndDate: new Date(rawDto.incomeCalculationEndDate),     // Convert
            };

            // Ensure your SaveExpenseAllocationsClientDto in the service expects Date objects
            // If it's defined to expect strings from the client, then the service needs to do the conversion.
            // But it's cleaner if the service layer always works with Date objects.

            const savedBudgetPlanWithAllocations = await this.budgetingService.saveExpenseAllocations(serviceDto, req.user.id);
            res.status(201).json({ success: true, data: savedBudgetPlanWithAllocations, message: "Budget plan saved successfully." });
        } catch (error) {
            next(error);
        }
    }
}