// src/repositories/transactionEvaluationRepository.ts
import { PrismaClient, Evaluation } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { BaseRepository } from './baseRepository';

@injectable()
export class TransactionEvaluationRepository extends BaseRepository<Evaluation> {
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.transaction);
    }

    // Add Transaction-specific methods if needed
}
