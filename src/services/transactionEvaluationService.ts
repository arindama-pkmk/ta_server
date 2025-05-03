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

    /**
     * Custom creation logic: automatically mark status = PENDING,
     * compute ratios, then update status to COMPLETED.
     */
    override async create(item: Evaluation): Promise<Evaluation> {
        // 1) create with status PENDING
        const pending = await super.create({ ...item, status: 'NOT_IDEAL' });
        // 2) perform actual calculation (placeholder)
        const result = this.calculateRatio(item);
        // 3) update with result and status
        return this.repository.update(pending.id, {
            calculationResult: result,
            status: 'IDEAL',
        });
    }

    private calculateRatio(item: Evaluation): number {
        // Business logic to derive ratio from item.transaction, etc.
        // Placeholder: return the given calculationResult or 0
        return item.calculationResult ?? 0;
    }
}
