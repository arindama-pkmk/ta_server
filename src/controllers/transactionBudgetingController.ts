// src/controllers/transactionBudgetingController.ts
import { Response, NextFunction } from 'express';
import { TransactionBudgetingService, SaveExpenseAllocationsClientDto } from '../services/transactionBudgetingService';
import { CreateBudgetAllocationDto, UpdateBudgetAllocationDto } from '../repositories/transactionBudgetingRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { AuthRequest } from '../types/auth';
import { BadRequestError, UnauthorizedError } from '../utils/errorHandler';
// Import Zod schemas from budgetValidator.ts

@injectable()
export class TransactionBudgetingController {
    private readonly budgetingService: TransactionBudgetingService;

    constructor(@inject(TYPES.TransactionBudgetingService) budgetingService: TransactionBudgetingService) {
        this.budgetingService = budgetingService;
    }

    // === BudgetAllocation CRUD ===
    async createAllocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            // Zod validation for req.body (e.g., createBudgetAllocationSchema) by middleware
            const dto = req.body as CreateBudgetAllocationDto;
            const allocation = await this.budgetingService.createBudgetAllocation(dto, req.user.id);
            res.status(201).json({ success: true, data: allocation });
        } catch (error) {
            next(error);
        }
    }

    async getAllocationsForPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { periodId } = req.query; // Or req.params
            if (!periodId || typeof periodId !== 'string') {
                return next(new BadRequestError("periodId query parameter is required."));
            }
            const allocations = await this.budgetingService.getBudgetAllocationsForPeriod(periodId, req.user.id);
            res.status(200).json({ success: true, data: allocations });
        } catch (error) {
            next(error);
        }
    }

    async getAllocationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { allocationId } = req.params;
            if (!allocationId || typeof allocationId !== 'string') {
                return next(new BadRequestError("allocationId parameter is required."));
            }
            const allocation = await this.budgetingService.getBudgetAllocationById(allocationId, req.user.id);
            res.status(200).json({ success: true, data: allocation });
        } catch (error) {
            next(error);
        }
    }

    async updateAllocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { allocationId } = req.params;
            if (!allocationId || typeof allocationId !== 'string') {
                return next(new BadRequestError("allocationId parameter is required."));
            }
            // Zod validation for req.body (e.g., updateBudgetAllocationSchema) by middleware
            const dto = req.body as UpdateBudgetAllocationDto;
            const updatedAllocation = await this.budgetingService.updateBudgetAllocation(allocationId, dto, req.user.id);
            res.status(200).json({ success: true, data: updatedAllocation });
        } catch (error) {
            next(error);
        }
    }

    async deleteAllocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { allocationId } = req.params;
            if (!allocationId || typeof allocationId !== 'string') {
                return next(new BadRequestError("allocationId parameter is required."));
            }
            await this.budgetingService.deleteBudgetAllocation(allocationId, req.user.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // === Core Budgeting Flow Endpoints ===

    async getIncomeSummaryForPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { periodId } = req.params; // Assuming periodId from path
            if (!periodId || typeof periodId !== 'string') {
                return next(new BadRequestError("periodId parameter is required."));
            }
            const summary = await this.budgetingService.getSummarizedIncomeForPeriod(periodId, req.user.id);
            res.status(200).json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }

    async getExpenseCategorySuggestions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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
            // Zod validation for SaveExpenseAllocationsClientDto by middleware
            const dto = req.body as SaveExpenseAllocationsClientDto;
            const savedAllocations = await this.budgetingService.saveExpenseAllocations(dto, req.user.id);
            res.status(201).json({ success: true, data: savedAllocations, message: "Budget plan saved successfully." });
        } catch (error) {
            next(error);
        }
    }
}