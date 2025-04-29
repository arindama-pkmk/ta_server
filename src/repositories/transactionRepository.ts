// src/repositories/transactionRepository.ts
import { PrismaClient, Transaction } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { BaseRepository } from './baseRepository';

@injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.transaction);
    }

    // Add Transaction-specific methods if needed
    override async findAll<Args = Record<string, unknown>, Result = Transaction & { category: { id: string; createdAt: Date; updatedAt: Date; accountType: string; categoryName: string; subcategoryName: string; } }>(args?: Args | undefined): Promise<Result[]> {
        // include categories
        return this.prisma.transaction.findMany({
            ...args,
            include: {
                category: true,
            },
        }) as Promise<Result[]>;
    }
}
