// src/services/transactionBudgetingService.ts
import {
    CategoryOccupation
} from '@prisma/client';
import {
    TransactionBudgetingRepository,
    CreateBudgetAllocationDto, // DTO from repository
    UpdateBudgetAllocationDto, // DTO from repository
    PopulatedBudgetAllocation
} from '../repositories/transactionBudgetingRepository';
import { PeriodService } from './periodService';
import { UserService } from './userService';
import { TransactionService, PopulatedTransaction } from './transactionService'; // PopulatedTransaction needed for income sum
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { AppError, BadRequestError, NotFoundError } from '../utils/errorHandler';

// DTO matching frontend for income summary items (backend provides this structure)
export interface IncomeByCategory {
    categoryId: string;
    categoryName: string;
    subcategories: Array<{
        subcategoryId: string;
        subcategoryName: string;
        totalAmount: number;
    }>;
    categoryTotalAmount: number;
}

// DTO for expense category suggestions (backend provides this structure)
export interface ExpenseCategorySuggestion { // Matches frontend model
    id: string; // categoryId
    name: string; // categoryName
    lowerBound?: number | null;
    upperBound?: number | null;
    subcategories: Array<{ id: string, name: string }>; // Simple subcategory info
}


// DTO from client for saving expense allocations
export interface SaveExpenseAllocationsClientDto {
    // userId is from AuthRequest
    budgetPeriodId: string;
    totalBudgetableIncome: number;
    allocations: Array<{
        categoryId: string;
        percentage: number;
        selectedSubcategoryIds: string[];
    }>;
}


@injectable()
export class TransactionBudgetingService {
    private readonly budgetingRepository: TransactionBudgetingRepository;
    private readonly transactionService: TransactionService;
    private readonly periodService: PeriodService;
    private readonly userService: UserService;

    constructor(
        @inject(TYPES.TransactionBudgetingRepository) budgetingRepository: TransactionBudgetingRepository,
        @inject(TYPES.TransactionService) transactionService: TransactionService,
        @inject(TYPES.PeriodService) periodService: PeriodService,
        @inject(TYPES.UserService) userService: UserService
    ) {
        this.budgetingRepository = budgetingRepository;
        this.transactionService = transactionService;
        this.periodService = periodService;
        this.userService = userService;
    }

    // === BudgetAllocation CRUD (scoped) ===
    async createBudgetAllocation(dto: CreateBudgetAllocationDto, userId: string): Promise<PopulatedBudgetAllocation> {
        const period = await this.periodService.getPeriodById(dto.periodId, userId); // Ensures period belongs to user
        // Additional validation: ensure categoryId and subcategoryId are valid and related
        const subcategory = await prisma.subcategory.findUnique({ where: { id: dto.subcategoryId } });
        if (!subcategory || subcategory.categoryId !== dto.categoryId) {
            throw new BadRequestError(`Subcategory ${dto.subcategoryId} does not belong to category ${dto.categoryId} or does not exist.`);
        }
        logger.info(`[BudgetingService] Creating BudgetAllocation for user ${userId}, period ${dto.periodId}`);
        return this.budgetingRepository.create(dto); // Repository create doesn't need userId if DTO has periodId
    }

    async getBudgetAllocationsForPeriod(periodId: string, userId: string): Promise<PopulatedBudgetAllocation[]> {
        const period = await this.periodService.getPeriodById(periodId, userId); // Validates period ownership
        logger.info(`[BudgetingService] Fetching allocations for user ${userId}, period ${periodId}`);
        return this.budgetingRepository.findAllByPeriodId(periodId);
    }

    async getBudgetAllocationById(id: string, userId: string): Promise<PopulatedBudgetAllocation> {
        const allocation = await this.budgetingRepository.findById(id);
        if (!allocation) {
            throw new NotFoundError(`BudgetAllocation with ID ${id} not found.`);
        }
        // Verify ownership through the period
        await this.periodService.getPeriodById(allocation.periodId, userId); // Throws if period not owned
        return allocation;
    }

    async updateBudgetAllocation(id: string, dto: UpdateBudgetAllocationDto, userId: string): Promise<PopulatedBudgetAllocation> {
        await this.getBudgetAllocationById(id, userId); // Ensures ownership and existence
        logger.info(`[BudgetingService] Updating BudgetAllocation ${id} for user ${userId}`);
        return this.budgetingRepository.update(id, dto);
    }

    async deleteBudgetAllocation(id: string, userId: string): Promise<void> {
        await this.getBudgetAllocationById(id, userId); // Ensures ownership and existence
        logger.info(`[BudgetingService] Soft-deleting BudgetAllocation ${id} for user ${userId}`);
        await this.budgetingRepository.softDelete(id);
    }

    // === Core Budgeting Logic ===

    // PSPEC 3.2 & 3.3: Fetch summarized income for a given period
    async getSummarizedIncomeForPeriod(periodId: string, userId: string): Promise<IncomeByCategory[]> {
        const period = await this.periodService.getPeriodById(periodId, userId); // Validates ownership
        if (period.periodType !== 'income' && period.periodType !== 'general_evaluation') { // general_evaluation might be allowed for broader income view
            throw new BadRequestError(`Period ${periodId} is not an income or general evaluation period.`);
        }

        const transactions: PopulatedTransaction[] = await this.transactionService.getAllUserTransactions(userId, {
            startDate: period.startDate.toISOString(),
            endDate: period.endDate.toISOString(),
            // No need to filter by accountType here if transactionService.getAllUserTransactions returns populated transactions
        });

        const incomeTransactions = transactions.filter(tx => tx.subcategory.category.accountType.name === "Pemasukan");

        const incomeSummaryMap: Map<string, IncomeByCategory> = new Map();
        for (const tx of incomeTransactions) {
            const cat = tx.subcategory.category;
            const subcat = tx.subcategory;

            if (!incomeSummaryMap.has(cat.id)) {
                incomeSummaryMap.set(cat.id, {
                    categoryId: cat.id, categoryName: cat.name,
                    subcategories: [], categoryTotalAmount: 0,
                });
            }

            const categoryEntry = incomeSummaryMap.get(cat.id)!;
            let subcatEntry = categoryEntry.subcategories.find(s => s.subcategoryId === subcat.id);
            if (!subcatEntry) {
                subcatEntry = { subcategoryId: subcat.id, subcategoryName: subcat.name, totalAmount: 0 };
                categoryEntry.subcategories.push(subcatEntry);
            }
            subcatEntry.totalAmount += tx.amount;
            categoryEntry.categoryTotalAmount += tx.amount;
        }
        return Array.from(incomeSummaryMap.values());
    }

    // PSPEC 3.5: Get expense category allocation suggestions
    async getExpenseCategorySuggestions(userId: string): Promise<ExpenseCategorySuggestion[]> {
        const userWithOccupation = await this.userService.getUserProfile(userId); // Gets populated user
        if (!userWithOccupation) throw new NotFoundError("User not found."); // Should not happen for authenticated user

        const expenseAccountType = await prisma.accountType.findUnique({ where: { name: "Pengeluaran" } });
        if (!expenseAccountType) throw new AppError("Critical: 'Pengeluaran' AccountType not found in database.", 500, false);

        const allExpenseCategories = await prisma.category.findMany({
            where: { accountTypeId: expenseAccountType.id, deletedAt: null },
            include: { subcategories: { where: { deletedAt: null }, select: { id: true, name: true } } }
        });

        let categoryOccupations: CategoryOccupation[] = [];
        if (userWithOccupation.occupationId) {
            categoryOccupations = await prisma.categoryOccupation.findMany({
                where: { occupationId: userWithOccupation.occupationId }
            });
        }
        const occupationSuggestionMap = new Map(categoryOccupations.map(co => [co.categoryId, co]));

        return allExpenseCategories.map(cat => {
            const suggestion = occupationSuggestionMap.get(cat.id);
            return {
                id: cat.id,
                name: cat.name,
                lowerBound: suggestion?.lowerBound ?? null,
                upperBound: suggestion?.upperBound ?? null,
                subcategories: cat.subcategories.map(s => ({ id: s.id, name: s.name })),
            };
        });
    }

    // PSPEC 3.5, 3.6, 3.7: Create/Update budget allocations for an expense period
    async saveExpenseAllocations(dto: SaveExpenseAllocationsClientDto, userId: string): Promise<PopulatedBudgetAllocation[]> {
        const { budgetPeriodId, totalBudgetableIncome, allocations } = dto;

        // 1. Validate Period and Ownership
        const budgetPeriod = await this.periodService.getPeriodById(budgetPeriodId, userId);
        if (budgetPeriod.periodType !== 'expense') {
            throw new BadRequestError(`Period ${budgetPeriodId} is not designated as an 'expense' period.`);
        }

        // 2. Validate total percentage (PSPEC 3.5)
        const totalPercentageAllocatedByClient = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
        if (allocations.length > 0 && totalBudgetableIncome > 0 && Math.abs(totalPercentageAllocatedByClient - 100) > 0.01) {
            throw new BadRequestError(`Total allocation percentage for categories must be 100%. Received: ${totalPercentageAllocatedByClient.toFixed(2)}%`);
        }
        if (totalBudgetableIncome > 0 && allocations.length === 0 && totalPercentageAllocatedByClient > 0) {
            throw new BadRequestError("Allocations provided but no categories selected or percentages are zero.");
        }


        return prisma.$transaction(async (tx) => {
            const results: PopulatedBudgetAllocation[] = [];

            // Delete existing allocations for this period that are NOT in the current DTO's categories
            // OR for categories in DTO but whose subcategory list will be fully replaced.
            const categoryIdsInDto = allocations.map(a => a.categoryId);
            await tx.budgetAllocation.updateMany({ // Soft delete
                where: {
                    periodId: budgetPeriodId,
                    deletedAt: null,
                    ...(categoryIdsInDto.length > 0
                        ? { categoryId: { notIn: categoryIdsInDto } }
                        : {})
                },
                data: { deletedAt: new Date() }
            });
            // Also soft delete existing allocations for categories that ARE in the DTO,
            // because we will recreate them with potentially new subcategory selections.
            if (categoryIdsInDto.length > 0) {
                await tx.budgetAllocation.updateMany({
                    where: { periodId: budgetPeriodId, categoryId: { in: categoryIdsInDto }, deletedAt: null },
                    data: { deletedAt: new Date() }
                });
            }


            for (const allocDetail of allocations) {
                if (allocDetail.percentage <= 0) { // Skip 0% or negative allocations
                    logger.info(`[BudgetingService] Skipping category ${allocDetail.categoryId} due to 0 or negative percentage.`);
                    continue;
                }

                const categoryExists = await tx.category.findFirst({ where: { id: allocDetail.categoryId, deletedAt: null } });
                if (!categoryExists) throw new BadRequestError(`Category ${allocDetail.categoryId} not found.`);

                const categoryAllocatedAmount = (allocDetail.percentage / 100) * totalBudgetableIncome;

                if (allocDetail.selectedSubcategoryIds.length === 0 && allocDetail.percentage > 0) {
                    logger.warn(`[BudgetingService] Category ${allocDetail.categoryId} allocated ${allocDetail.percentage}% but no subcategories selected. No allocations created for it.`);
                    continue;
                }

                for (const subId of allocDetail.selectedSubcategoryIds) {
                    const subcategory = await tx.subcategory.findFirst({ where: { id: subId, categoryId: allocDetail.categoryId, deletedAt: null } });
                    if (!subcategory) {
                        logger.warn(`[BudgetingService] Subcategory ${subId} not found under category ${allocDetail.categoryId} or is deleted. Skipping allocation for this subcategory.`);
                        continue;
                    }

                    const createData: CreateBudgetAllocationDto = {
                        periodId: budgetPeriodId,
                        categoryId: allocDetail.categoryId,
                        subcategoryId: subId,
                        percentage: new Decimal(allocDetail.percentage), // Parent Category's percentage
                        amount: new Decimal(categoryAllocatedAmount),   // Parent Category's total allocated amount
                    };
                    // Use the repository's create method which works with the transactional client if passed
                    // Or use tx.budgetAllocation.create directly
                    const newDbAllocation = await tx.budgetAllocation.create({
                        data: createData,
                        include: {
                            category: true,
                            subcategory: true,
                            period: true,
                        }
                    });
                    results.push(newDbAllocation as PopulatedBudgetAllocation);
                }
            }
            return results;
        });
    }

    // checkBudgetsAndSendNotifications method (from previous response) would go here
    // ...
}