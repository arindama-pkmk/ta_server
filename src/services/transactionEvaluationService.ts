// src/services/transactionEvaluationService.ts
import { Evaluation } from '@prisma/client';
import { BaseService } from './baseService';
import { TransactionEvaluationRepository } from '../repositories/transactionEvaluationRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionEvaluationService extends BaseService<Evaluation> {
    constructor(@inject(TYPES.TransactionEvaluationRepository) repository: TransactionEvaluationRepository) {
        super(repository);
    }

    async createHistory(data: Evaluation): Promise<Evaluation> {
        return this.repository.create(data);
    }

    async getHistories(userId: string, start?: Date, end?: Date): Promise<Evaluation[]> {
        if (start && end) {
            return (this.repository as TransactionEvaluationRepository).findByDateRange(userId, start, end);
        }
        return this.repository.findAll({ where: { userId } });
    }
}
