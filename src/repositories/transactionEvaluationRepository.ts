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

    async findByDateRange(userId: string, start: Date, end: Date): Promise<Evaluation[]> {
        return this.prisma.evaluation.findMany({
            where: {
                userId,
                start: { gte: start },
                end: { lte: end },
            },
        });
    }
}
