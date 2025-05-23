// src/repositories/transactionBudgetingRepository.ts
import { PrismaClient, BudgetPlan, ExpenseAllocation, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { Decimal } from '@prisma/client/runtime/library';

// DTO for BudgetPlan Creation
export type CreateBudgetPlanDto = Omit<BudgetPlan, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'user' | 'allocations'>;

// DTO for ExpenseAllocation Creation (linked to a BudgetPlan)
export type CreateExpenseAllocationDto = Omit<ExpenseAllocation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'budgetPlan' | 'category' | 'subcategory'> & {
    // budgetPlanId is connected internally
    // categoryId and subcategoryId are direct fields
};

export type UpdateExpenseAllocationDto = Partial<Pick<ExpenseAllocation, 'percentage' | 'amount'>>;

const expenseAllocationIncludeDefault = {
    category: true,
    subcategory: true,
} satisfies Prisma.ExpenseAllocationInclude;

const budgetPlanIncludeDefault = {
    allocations: {
        where: { deletedAt: null },
        include: expenseAllocationIncludeDefault,
    },
    user: false, // Usually not needed when fetching a plan
} satisfies Prisma.BudgetPlanInclude;


export type PopulatedExpenseAllocation = Prisma.ExpenseAllocationGetPayload<{
    include: typeof expenseAllocationIncludeDefault
}>;

export type PopulatedBudgetPlan = Prisma.BudgetPlanGetPayload<{
    include: typeof budgetPlanIncludeDefault
}>;


@injectable()
export class TransactionBudgetingRepository {
    private readonly prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // --- BudgetPlan Methods ---
    async createBudgetPlan(data: CreateBudgetPlanDto, userId: string): Promise<PopulatedBudgetPlan> {
        return this.prisma.budgetPlan.create({
            data: {
                ...data,
                userId: userId,
            },
            include: budgetPlanIncludeDefault,
        });
    }

    async findBudgetPlanById(id: string, userId: string): Promise<PopulatedBudgetPlan | null> {
        return this.prisma.budgetPlan.findFirst({
            where: { id, userId, deletedAt: null },
            include: budgetPlanIncludeDefault,
        });
    }

    async findBudgetPlansByUserAndDateRange(
        userId: string,
        planStartDate: Date,
        planEndDate: Date,
        args?: Prisma.BudgetPlanFindManyArgs
    ): Promise<PopulatedBudgetPlan[]> {
        return this.prisma.budgetPlan.findMany({
            ...args,
            where: {
                userId,
                planStartDate,
                planEndDate,
                deletedAt: null,
                ...(args?.where)
            },
            include: budgetPlanIncludeDefault,
            orderBy: args?.orderBy || { planStartDate: 'desc' }
        });
    }

    async updateBudgetPlan(id: string, data: Partial<CreateBudgetPlanDto>, userId: string): Promise<PopulatedBudgetPlan | null> {
        // Ensure user owns this plan
        const existing = await this.prisma.budgetPlan.findFirst({ where: { id, userId } });
        if (!existing) return null;

        return this.prisma.budgetPlan.update({
            where: { id },
            data,
            include: budgetPlanIncludeDefault
        });
    }

    async softDeleteBudgetPlan(id: string, userId: string): Promise<PopulatedBudgetPlan | null> {
        const existing = await this.prisma.budgetPlan.findFirst({ where: { id, userId } });
        if (!existing) return null;

        // Also soft-delete its allocations in a transaction (best handled in service)
        return this.prisma.budgetPlan.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: budgetPlanIncludeDefault,
        });
    }


    // --- ExpenseAllocation Methods ---
    async createExpenseAllocation(data: CreateExpenseAllocationDto, budgetPlanId: string): Promise<PopulatedExpenseAllocation> {
        return this.prisma.expenseAllocation.create({
            data: {
                budgetPlanId,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                percentage: new Decimal(data.percentage.toString()), // Ensure Decimal
                amount: new Decimal(data.amount.toString()),       // Ensure Decimal
            },
            include: expenseAllocationIncludeDefault,
        });
    }

    async findExpenseAllocationById(id: string): Promise<PopulatedExpenseAllocation | null> {
        return this.prisma.expenseAllocation.findFirst({
            where: { id, deletedAt: null },
            include: expenseAllocationIncludeDefault,
        });
    }

    async findAllAllocationsByBudgetPlanId(budgetPlanId: string): Promise<PopulatedExpenseAllocation[]> {
        return this.prisma.expenseAllocation.findMany({
            where: { budgetPlanId, deletedAt: null },
            include: expenseAllocationIncludeDefault,
            orderBy: { category: { name: 'asc' } },
        });
    }

    async updateExpenseAllocation(id: string, data: UpdateExpenseAllocationDto): Promise<PopulatedExpenseAllocation> {
        const updateData: Prisma.ExpenseAllocationUpdateInput = {};
        if (data.percentage !== undefined) updateData.percentage = new Decimal(data.percentage.toString());
        if (data.amount !== undefined) updateData.amount = new Decimal(data.amount.toString());
        return this.prisma.expenseAllocation.update({
            where: { id },
            data: updateData,
            include: expenseAllocationIncludeDefault,
        });
    }

    async softDeleteExpenseAllocation(id: string): Promise<PopulatedExpenseAllocation> {
        return this.prisma.expenseAllocation.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: expenseAllocationIncludeDefault,
        });
    }

    async softDeleteManyAllocationsByBudgetPlanId(budgetPlanId: string): Promise<Prisma.BatchPayload> {
        return this.prisma.expenseAllocation.updateMany({
            where: { budgetPlanId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
    }
}