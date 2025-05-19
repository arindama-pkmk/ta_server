// src/repositories/transactionBudgetingRepository.ts
import { PrismaClient, BudgetAllocation, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

// DTO for BudgetAllocation Creation
// Client sends categoryId, subcategoryId, periodId, percentage, amount
export type CreateBudgetAllocationDto = Omit<BudgetAllocation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'category' | 'subcategory' | 'period'>;

// DTO for BudgetAllocation Update (specific fields might be updatable)
export type UpdateBudgetAllocationDto = Partial<Pick<BudgetAllocation, 'percentage' | 'amount'>>; // Example: only these are updatable

// Define the include object for populated BudgetAllocations
const budgetAllocationIncludeDefault = {
    category: true,
    subcategory: true,
    period: true, // Important for user scoping and context
} satisfies Prisma.BudgetAllocationInclude;

// Prisma's way of getting the type with includes
export type PopulatedBudgetAllocation = Prisma.BudgetAllocationGetPayload<{
    include: typeof budgetAllocationIncludeDefault
}>;

@injectable()
export class TransactionBudgetingRepository {
    private readonly prisma: PrismaClient;
    private readonly defaultInclude = budgetAllocationIncludeDefault;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: CreateBudgetAllocationDto): Promise<PopulatedBudgetAllocation> {
        return this.prisma.budgetAllocation.create({
            data: {
                category: { connect: { id: data.categoryId } },
                subcategory: { connect: { id: data.subcategoryId } },
                period: { connect: { id: data.periodId } },
                percentage: data.percentage,
                amount: data.amount,
            },
            include: this.defaultInclude,
        });
    }

    async findById(id: string): Promise<PopulatedBudgetAllocation | null> {
        return this.prisma.budgetAllocation.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: this.defaultInclude,
        });
    }

    async findAllByPeriodId(
        periodId: string,
        args?: Omit<Prisma.BudgetAllocationFindManyArgs, 'where' | 'include'> & { where?: Prisma.BudgetAllocationWhereInput }
    ): Promise<PopulatedBudgetAllocation[]> {
        // Note: User scoping is typically handled by ensuring the periodId belongs to the user in the service layer.
        const queryArgs: Prisma.BudgetAllocationFindManyArgs = {
            ...args,
            where: {
                ...(args?.where || {}),
                periodId,
                deletedAt: null,
            },
            include: this.defaultInclude,
            orderBy: args?.orderBy || { category: { name: 'asc' } }, // Example default order
        };
        return this.prisma.budgetAllocation.findMany({
            ...queryArgs,
            include: {
                category: true,
                subcategory: true,
                period: true,
            },
        });
    }

    async findManyByCriteria(
        criteria: Prisma.BudgetAllocationWhereInput,
        args?: Omit<Prisma.BudgetAllocationFindManyArgs, 'where' | 'include'>
    ): Promise<PopulatedBudgetAllocation[]> {
        const queryArgs: Prisma.BudgetAllocationFindManyArgs = {
            ...args,
            where: {
                ...criteria, // Caller (service) must ensure userId scoping via periodId and deletedAt: null
                deletedAt: null,
            },
            include: this.defaultInclude,
        };
        return this.prisma.budgetAllocation.findMany({
            ...queryArgs,
            include: this.defaultInclude,
        });
    }


    async update(id: string, data: UpdateBudgetAllocationDto): Promise<PopulatedBudgetAllocation> {
        // Ownership and existence check in service layer
        // Only include fields that are defined
        const updateData: Prisma.BudgetAllocationUpdateInput = {};
        if (data.percentage !== undefined) {
            updateData.percentage = data.percentage;
        }
        if (data.amount !== undefined) {
            updateData.amount = data.amount;
        }
        return this.prisma.budgetAllocation.update({
            where: { id },
            data: updateData,
            include: this.defaultInclude,
        });
    }

    async softDelete(id: string): Promise<PopulatedBudgetAllocation> {
        return this.prisma.budgetAllocation.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: this.defaultInclude,
        });
    }

    async deleteMany(args: Prisma.BudgetAllocationDeleteManyArgs): Promise<Prisma.BatchPayload> {
        // Used for clearing allocations for a period/category during budget saving
        return this.prisma.budgetAllocation.deleteMany(args);
    }

    // Hard delete (if needed)
    async hardDelete(id: string): Promise<BudgetAllocation> {
        return this.prisma.budgetAllocation.delete({
            where: { id },
        });
    }

    // Restore (if needed)
    async restore(id: string): Promise<PopulatedBudgetAllocation> {
        return this.prisma.budgetAllocation.update({
            where: { id },
            data: { deletedAt: null },
            include: this.defaultInclude,
        });
    }
}