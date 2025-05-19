// src/repositories/transactionRepository.ts
import { PrismaClient, Transaction, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

// DTO for Transaction Creation (client sends subcategoryId)
export type CreateTransactionDto = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'subcategory'> & {
    subcategoryId: string; // Ensure this is here, as Prisma model Transaction doesn't list it as required if it's a relation scalar
    isBookmarked?: boolean; // Make optional if it has a default
    // date: Date; // Ensure date is here if not automatically on Transaction type from Omit
    // amount: number;
    // description: string;
};

// DTO for Transaction Update (most fields optional, subcategoryId optional for changing it)
export type UpdateTransactionDto = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId' | 'subcategory'>> & {
    subcategoryId?: string; // Allow changing subcategory
};

// Define the include object separately for reusability and type safety
const transactionIncludeDefault = {
    subcategory: {
        include: {
            category: {
                include: {
                    accountType: true,
                },
            },
        },
    },
    user: true, // Often useful to include the user
} satisfies Prisma.TransactionInclude; // Use 'satisfies' for type checking the include object

// This is Prisma's way of getting the type of a Transaction with the above includes
export type PopulatedTransaction = Prisma.TransactionGetPayload<{
    include: typeof transactionIncludeDefault
}>;


@injectable()
export class TransactionRepository {
    private readonly prisma: PrismaClient;
    private readonly defaultInclude = transactionIncludeDefault; // Use the defined const

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: CreateTransactionDto, userId: string): Promise<PopulatedTransaction> {
        return this.prisma.transaction.create({
            data: {
                description: data.description,
                amount: data.amount,
                date: data.date,
                isBookmarked: data.isBookmarked ?? false, // Use nullish coalescing for default
                user: { connect: { id: userId } },
                subcategory: { connect: { id: data.subcategoryId } },
            },
            include: this.defaultInclude,
        });
    }

    async findById(id: string): Promise<PopulatedTransaction | null> {
        return this.prisma.transaction.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: this.defaultInclude,
        });
    }

    async findAllByUserId(
        userId: string,
        args?: Omit<Prisma.TransactionFindManyArgs, 'where' | 'include'> & { where?: Prisma.TransactionWhereInput }
    ): Promise<PopulatedTransaction[]> {
        const restArgs = args ?? {};
        const queryArgs: Prisma.TransactionFindManyArgs = {
            ...restArgs,
            where: {
                ...(args?.where || {}),
                userId,
                deletedAt: null,
            },
            include: {
                user: true,
                subcategory: true,
            },
            orderBy: args?.orderBy || { date: 'desc' },
        };
        return this.prisma.transaction.findMany({
            ...queryArgs,
            include: transactionIncludeDefault,
        });
    }

    async findByCriteria(
        criteria: Prisma.TransactionWhereInput,
        args?: Omit<Prisma.TransactionFindManyArgs, 'where' | 'include'>
    ): Promise<PopulatedTransaction[]> {
        // Ensure criteria passed by service also includes userId if necessary for security
        const queryArgs: Prisma.TransactionFindManyArgs = {
            ...args,
            where: {
                ...criteria,
                deletedAt: null, // Always apply unless criteria explicitly overrides it
            },
            include: {
                subcategory: {
                    include: {
                        category: {
                            include: {
                                accountType: true,
                            },
                        },
                    },
                },
                user: true, // Include the user property
            },
            orderBy: args?.orderBy || { date: 'desc' }
        };
        return this.prisma.transaction.findMany({
            ...queryArgs,
            include: {
                subcategory: {
                    include: {
                        category: {
                            include: {
                                accountType: true,
                            },
                        },
                    },
                },
                user: true,
            },
        });
    }

    async update(id: string, data: UpdateTransactionDto): Promise<PopulatedTransaction> {
        const { subcategoryId, ...restOfData } = data;
        const updatePayload: Prisma.TransactionUpdateInput = { ...restOfData };

        if (subcategoryId) {
            updatePayload.subcategory = { connect: { id: subcategoryId } };
        }

        return this.prisma.transaction.update({
            where: { id }, // Service layer ensures it's not deletedAt and owned by user
            data: updatePayload,
            include: this.defaultInclude,
        });
    }

    async softDelete(id: string): Promise<PopulatedTransaction> {
        return this.prisma.transaction.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: this.defaultInclude, // Return the soft-deleted (but populated) record
        });
    }

    async hardDelete(id: string): Promise<Transaction> { // Returns basic Transaction as it's gone
        return this.prisma.transaction.delete({
            where: { id },
        });
    }

    async restore(id: string): Promise<PopulatedTransaction> {
        return this.prisma.transaction.update({
            where: { id },
            data: { deletedAt: null },
            include: this.defaultInclude,
        });
    }
}