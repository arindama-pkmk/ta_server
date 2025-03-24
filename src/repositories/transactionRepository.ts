// repositories/transactionRepository.ts
import { PrismaClient, Transaction } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
    /**
     * Initializes a new instance of the TransactionRepository class with the specified PrismaClient instance.
     *
     * @param {PrismaClient} prisma - The PrismaClient instance to use for database operations.
     */
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.transaction);
    }

    // Add Transaction-specific methods if needed
}
