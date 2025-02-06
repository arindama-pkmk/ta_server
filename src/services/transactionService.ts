// services/transactionService.ts
import { Transaction } from '@prisma/client';
import { BaseService } from './baseService';
import { TransactionRepository } from '../repositories/transactionRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class TransactionService extends BaseService<Transaction> {
    /**
     * Initializes a new instance of the TransactionService class with the specified TransactionRepository.
     *
     * @param {TransactionRepository} transactionRepository - The TransactionRepository that will be used to perform the operations.
     */
    constructor(@inject(TYPES.TransactionRepository) transactionRepository: TransactionRepository) {
        super(transactionRepository);
    }
}
