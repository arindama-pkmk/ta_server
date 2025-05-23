// src/services/transactionBudgetingService.ts
import { CategoryOccupation, ExpenseAllocation, BudgetPlan as PrismaBudgetPlan, Prisma } from '@prisma/client';
import {
    TransactionBudgetingRepository,
    // CreateExpenseAllocationDto is now more specific to adding to an existing plan
    // The main creation happens via SaveExpenseAllocationsClientDto
    CreateExpenseAllocationDto,
    UpdateExpenseAllocationDto,
    PopulatedExpenseAllocation,
    PopulatedBudgetPlan,
    CreateBudgetPlanDto
} from '../repositories/transactionBudgetingRepository';
import { UserService } from './userService';
import { TransactionService, PopulatedTransaction } from './transactionService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { AppError, BadRequestError, NotFoundError } from '../utils/errorHandler';

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

export interface ExpenseCategorySuggestion {
    id: string; // categoryId
    name: string; // categoryName
    lowerBound?: number | null;
    upperBound?: number | null;
    subcategories: Array<{ id: string, name: string }>;
}

export interface SaveExpenseAllocationsClientDto {
    planDescription: string| null;
    planStartDate: Date;
    planEndDate: Date;
    incomeCalculationStartDate: Date;
    incomeCalculationEndDate: Date;
    totalCalculatedIncome: number;
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
    private readonly userService: UserService;

    constructor(
        @inject(TYPES.TransactionBudgetingRepository) budgetingRepository: TransactionBudgetingRepository,
        @inject(TYPES.TransactionService) transactionService: TransactionService,
        @inject(TYPES.UserService) userService: UserService
    ) {
        this.budgetingRepository = budgetingRepository;
        this.transactionService = transactionService;
        this.userService = userService;
    }

    private validateBudgetPlanDates(startDate: Date, endDate: Date): void {
        if (!startDate || !endDate) { // Should be caught by Zod, but good for direct calls
            throw new BadRequestError("Plan start date and end date must be provided.");
        }
        if (endDate < startDate) {
            throw new BadRequestError("Budget plan end date cannot be before start date.");
        }
        // Using Math.ceil and difference in milliseconds for days to be inclusive
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 31) {
            throw new BadRequestError("Budget plan range cannot exceed approximately 1 month (31 days).");
        }
    }

    async createNewBudgetPlan(dto: CreateBudgetPlanDto, userId: string): Promise<PopulatedBudgetPlan> {
        this.validateBudgetPlanDates(dto.planStartDate, dto.planEndDate);
        if (dto.incomeCalculationEndDate < dto.incomeCalculationStartDate) {
            throw new BadRequestError("Income calculation end date cannot be before start date for the budget plan.");
        }
        // Potentially check for duplicate budget plans by name for the same date range for a user
        const existingPlan = await prisma.budgetPlan.findFirst({
            where: {
                userId,
                planStartDate: dto.planStartDate,
                planEndDate: dto.planEndDate,
                description: dto.description, // null or specific description
                deletedAt: null,
            }
        });
        if (existingPlan) {
            throw new BadRequestError(`A budget plan with the same description and dates already exists (ID: ${existingPlan.id}).`);
        }

        return this.budgetingRepository.createBudgetPlan(dto, userId);
    }

    async getBudgetPlanById(budgetPlanId: string, userId: string): Promise<PopulatedBudgetPlan> {
        const plan = await this.budgetingRepository.findBudgetPlanById(budgetPlanId, userId);
        if (!plan) {
            throw new NotFoundError(`BudgetPlan with ID ${budgetPlanId} not found or access denied.`);
        }
        return plan;
    }

    async getBudgetPlansForUser(userId: string, queryStartDate?: Date, queryEndDate?: Date): Promise<PopulatedBudgetPlan[]> {
        // If queryStartDate and queryEndDate are provided, find plans that *overlap* with this range.
        // This is more complex than finding plans *within* a range.
        // For now, let's find plans *fully contained* within the query range if provided, or all.
        let whereClause: Prisma.BudgetPlanWhereInput = { userId, deletedAt: null };
        if (queryStartDate && queryEndDate) {
            whereClause = {
                ...whereClause,
                planStartDate: { gte: queryStartDate },
                planEndDate: { lte: queryEndDate }
            };
        }
        return prisma.budgetPlan.findMany({
            where: whereClause,
            include: { allocations: { where: { deletedAt: null }, include: { category: true, subcategory: true } } },
            orderBy: { planStartDate: 'desc' }
        });
    }

    async updateExistingBudgetPlan(budgetPlanId: string, dto: Partial<CreateBudgetPlanDto>, userId: string): Promise<PopulatedBudgetPlan> {
        const plan = await this.getBudgetPlanById(budgetPlanId, userId); // Ensures ownership

        if (dto.planStartDate || dto.planEndDate) {
            this.validateBudgetPlanDates(dto.planStartDate || plan.planStartDate, dto.planEndDate || plan.planEndDate);
        }
        if (dto.incomeCalculationStartDate || dto.incomeCalculationEndDate) {
            if ((dto.incomeCalculationEndDate || plan.incomeCalculationEndDate) < (dto.incomeCalculationStartDate || plan.incomeCalculationStartDate)) {
                throw new BadRequestError("Income calculation end date cannot be before start date.");
            }
        }
        // Check for duplicates if description/dates are changing
        if (dto.description !== undefined || dto.planStartDate || dto.planEndDate) {
            const checkDesc = dto.description === undefined ? plan.description : dto.description;
            const checkStart = dto.planStartDate || plan.planStartDate;
            const checkEnd = dto.planEndDate || plan.planEndDate;
            const existingPlan = await prisma.budgetPlan.findFirst({
                where: {
                    userId,
                    planStartDate: checkStart,
                    planEndDate: checkEnd,
                    description: checkDesc,
                    deletedAt: null,
                    id: { not: budgetPlanId } // Exclude the current plan itself
                }
            });
            if (existingPlan) {
                throw new BadRequestError(`Another budget plan with the same description and dates already exists (ID: ${existingPlan.id}).`);
            }
        }

        const updatedPlan = await this.budgetingRepository.updateBudgetPlan(budgetPlanId, dto, userId);
        if (!updatedPlan) throw new NotFoundError('Failed to update budget plan or plan not found.'); // Should be caught by getBudgetPlanById
        return updatedPlan;
    }


    async deleteBudgetPlan(budgetPlanId: string, userId: string): Promise<void> {
        await this.getBudgetPlanById(budgetPlanId, userId); // Ensures ownership and existence
        await prisma.$transaction(async (tx) => {
            await tx.expenseAllocation.updateMany({
                where: { budgetPlanId: budgetPlanId, deletedAt: null },
                data: { deletedAt: new Date() }
            });
            await tx.budgetPlan.update({
                where: { id: budgetPlanId },
                data: { deletedAt: new Date() }
            });
        });
        logger.info(`[BudgetingService] Soft-deleted BudgetPlan ${budgetPlanId} and its allocations for user ${userId}`);
    }

    async addExpenseAllocationToPlan(dto: CreateExpenseAllocationDto, budgetPlanId: string, userId: string): Promise<PopulatedExpenseAllocation> {
        const budgetPlan = await this.getBudgetPlanById(budgetPlanId, userId); // Ensures plan belongs to user and fetches it
        const subcategory = await prisma.subcategory.findUnique({ where: { id: dto.subcategoryId, deletedAt: null } });
        if (!subcategory || subcategory.categoryId !== dto.categoryId) {
            throw new BadRequestError(`Subcategory ${dto.subcategoryId} does not belong to category ${dto.categoryId} or does not exist.`);
        }

        const calculatedAmount = (Number(dto.percentage) / 100) * Number(budgetPlan.totalCalculatedIncome);
        const allocationDataWithAmount = {
            ...dto,
            amount: new Decimal(calculatedAmount.toFixed(2)) // Ensure two decimal places for currency
        };
        return this.budgetingRepository.createExpenseAllocation(allocationDataWithAmount, budgetPlanId);
    }

    async getAllocationsForBudgetPlan(budgetPlanId: string, userId: string): Promise<PopulatedExpenseAllocation[]> {
        await this.getBudgetPlanById(budgetPlanId, userId); // Validates plan ownership
        return this.budgetingRepository.findAllAllocationsByBudgetPlanId(budgetPlanId);
    }

    async getExpenseAllocationById(allocationId: string, userId: string): Promise<PopulatedExpenseAllocation> {
        const allocation = await this.budgetingRepository.findExpenseAllocationById(allocationId);
        if (!allocation) {
            throw new NotFoundError(`ExpenseAllocation with ID ${allocationId} not found.`);
        }
        await this.getBudgetPlanById(allocation.budgetPlanId, userId); // Verify ownership through the budget plan
        return allocation;
    }

    async updateExpenseAllocation(allocationId: string, dto: UpdateExpenseAllocationDto, userId: string): Promise<PopulatedExpenseAllocation> {
        const existingAllocation = await this.getExpenseAllocationById(allocationId, userId); // Ensures ownership & existence
        const budgetPlan = await this.budgetingRepository.findBudgetPlanById(existingAllocation.budgetPlanId, userId);
        if (!budgetPlan) throw new NotFoundError("Associated Budget Plan not found for recalculating amount/percentage.");

        let finalDto = { ...dto }; // Create a mutable copy

        if (dto.percentage !== undefined && dto.amount === undefined) {
            const newAmount = (Number(dto.percentage) / 100) * Number(budgetPlan.totalCalculatedIncome);
            finalDto.amount = new Decimal(newAmount.toFixed(2));
        } else if (dto.amount !== undefined && dto.percentage === undefined) {
            if (Number(budgetPlan.totalCalculatedIncome) === 0 && Number(dto.amount) > 0) {
                throw new BadRequestError("Cannot set amount when total calculated income for the plan is zero.");
            }
            const newPercentage = Number(budgetPlan.totalCalculatedIncome) === 0 ? 0 : (Number(dto.amount) / Number(budgetPlan.totalCalculatedIncome)) * 100;
            finalDto.percentage = new Decimal(newPercentage.toFixed(2)); // Store percentage with precision
        } else if (dto.percentage !== undefined && dto.amount !== undefined) {
            // If both are provided, ensure they are consistent or decide which one takes precedence.
            // For now, let's assume they should be consistent or client sends one.
            // Or, recalculate amount based on percentage if both are sent to ensure consistency:
            const newAmount = (Number(dto.percentage) / 100) * Number(budgetPlan.totalCalculatedIncome);
            finalDto.amount = new Decimal(newAmount.toFixed(2));
        }

        return this.budgetingRepository.updateExpenseAllocation(allocationId, finalDto);
    }

    async deleteExpenseAllocation(allocationId: string, userId: string): Promise<void> {
        await this.getExpenseAllocationById(allocationId, userId); // Ensures ownership
        await this.budgetingRepository.softDeleteExpenseAllocation(allocationId);
    }


    async getSummarizedIncomeForDateRange(startDate: Date, endDate: Date, userId: string): Promise<IncomeByCategory[]> {
        if (!startDate || !endDate) {
            throw new BadRequestError("Start date and end date for income summary are required.");
        }
        if (endDate < startDate) throw new BadRequestError("Income summary end date cannot be before start date.");
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 35) { // Example validation, adjust as needed
            throw new BadRequestError("Income summary date range too large (max ~35 days).");
        }

        const transactions = await this.transactionService.getAllUserTransactions(userId, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
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
            subcatEntry.totalAmount += tx.amount; // Assumes amount is number
            categoryEntry.categoryTotalAmount += tx.amount; // Assumes amount is number
        }
        return Array.from(incomeSummaryMap.values());
    }

    async getExpenseCategorySuggestions(userId: string): Promise<ExpenseCategorySuggestion[]> {
        const userWithOccupation = await this.userService.getUserProfile(userId);
        if (!userWithOccupation) throw new NotFoundError("User not found.");
        const expenseAccountType = await prisma.accountType.findUnique({ where: { name: "Pengeluaran" } });
        if (!expenseAccountType) throw new AppError("Critical: 'Pengeluaran' AccountType not found.", 500, false);

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
                id: cat.id, name: cat.name,
                lowerBound: suggestion?.lowerBound ?? null, upperBound: suggestion?.upperBound ?? null,
                subcategories: cat.subcategories.map(s => ({ id: s.id, name: s.name })),
            };
        });
    }

    async saveExpenseAllocations(dto: SaveExpenseAllocationsClientDto, userId: string): Promise<PopulatedBudgetPlan> {
        this.validateBudgetPlanDates(dto.planStartDate, dto.planEndDate);
        if (dto.incomeCalculationEndDate < dto.incomeCalculationStartDate) {
            throw new BadRequestError("Income calculation end date for the plan cannot be before start date.");
        }

        const totalPercentageAllocated = dto.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
        if (dto.allocations.length > 0 && dto.totalCalculatedIncome > 0 && Math.abs(totalPercentageAllocated - 100) > 0.01) {
            throw new BadRequestError(`Total allocation percentage for categories must be 100%. Received: ${totalPercentageAllocated.toFixed(2)}%`);
        }

        return prisma.$transaction(async (tx) => {
            const budgetPlanData: CreateBudgetPlanDto = {
                description: dto.planDescription,
                planStartDate: dto.planStartDate,
                planEndDate: dto.planEndDate,
                incomeCalculationStartDate: dto.incomeCalculationStartDate,
                incomeCalculationEndDate: dto.incomeCalculationEndDate,
                totalCalculatedIncome: new Decimal(dto.totalCalculatedIncome.toString()),
            };

            const existingPlan = await tx.budgetPlan.findFirst({
                where: {
                    userId,
                    planStartDate: dto.planStartDate,
                    planEndDate: dto.planEndDate,
                    description: dto.planDescription,
                    deletedAt: null,
                }
            });

            let budgetPlan: PrismaBudgetPlan;
            if (existingPlan) {
                logger.info(`[BudgetingService] Updating existing BudgetPlan ${existingPlan.id} for user ${userId}`);
                budgetPlan = await tx.budgetPlan.update({
                    where: { id: existingPlan.id },
                    data: { // Only update fields that can change if an existing plan is being "resaved"
                        incomeCalculationStartDate: dto.incomeCalculationStartDate,
                        incomeCalculationEndDate: dto.incomeCalculationEndDate,
                        totalCalculatedIncome: new Decimal(dto.totalCalculatedIncome.toString()),
                        // description: dto.planDescription, // Allow description update
                    },
                });
                // Soft delete old allocations for this plan before adding new ones
                await tx.expenseAllocation.updateMany({
                    where: { budgetPlanId: budgetPlan.id, deletedAt: null },
                    data: { deletedAt: new Date() }
                });
            } else {
                logger.info(`[BudgetingService] Creating new BudgetPlan for user ${userId}`);
                budgetPlan = await tx.budgetPlan.create({
                    data: { ...budgetPlanData, userId }
                });
            }

            for (const allocDetail of dto.allocations) {
                if (allocDetail.percentage <= 0) continue;

                const categoryExists = await tx.category.findFirst({ where: { id: allocDetail.categoryId, deletedAt: null } });
                if (!categoryExists) throw new BadRequestError(`Category ${allocDetail.categoryId} not found.`);

                const categoryAllocatedAmount = (allocDetail.percentage / 100) * dto.totalCalculatedIncome;

                if (allocDetail.selectedSubcategoryIds.length === 0) {
                    logger.warn(`Category ${allocDetail.categoryId} allocated ${allocDetail.percentage}% but no subcategories selected. No allocations created for it.`);
                    continue;
                }

                for (const subId of allocDetail.selectedSubcategoryIds) {
                    const subcategory = await tx.subcategory.findFirst({ where: { id: subId, categoryId: allocDetail.categoryId, deletedAt: null } });
                    if (!subcategory) {
                        logger.warn(`Subcategory ${subId} not found under category ${allocDetail.categoryId} or is deleted. Skipping allocation.`);
                        continue;
                    }
                    await tx.expenseAllocation.create({
                        data: {
                            budgetPlanId: budgetPlan.id,
                            categoryId: allocDetail.categoryId,
                            subcategoryId: subId,
                            percentage: new Decimal(allocDetail.percentage.toString()),
                            amount: new Decimal(categoryAllocatedAmount.toFixed(2)), // Ensure currency precision
                        }
                    });
                }
            }

            const finalPopulatedPlan = await tx.budgetPlan.findUniqueOrThrow({
                where: { id: budgetPlan.id },
                include: {
                    allocations: {
                        where: { deletedAt: null },
                        include: { category: true, subcategory: true }
                    }
                }
            });
            return finalPopulatedPlan as PopulatedBudgetPlan;
        });
    }
}