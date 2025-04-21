import { Allocation } from '@prisma/client';
import { BaseService } from './baseService';
import { TransactionBudgetingRepository } from '../repositories/transactionBudgetingRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionBudgetingService extends BaseService<Allocation> {
    constructor(@inject(TYPES.TransactionBudgetingRepository) repository: TransactionBudgetingRepository) {
        super(repository);
    }

    /**
     * Optionally add custom business logic here.
     * E.g., enforce percentage sum <= 100 for a given user/month
     */
    override async create(item: Allocation): Promise<Allocation> {
        // Example: validate sum of allocations before creating
        // await this.validateAllocationSum(item.userId, item.month, item.percentage);
        return super.create(item);
    }
}
