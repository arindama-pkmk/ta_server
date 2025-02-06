// controllers/transactionController.ts
import { Transaction } from '@prisma/client';
import { BaseController } from './baseController';
import { TransactionService } from '../services/transactionService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class TransactionController extends BaseController<Transaction> {
    /**
     * Initializes a new instance of the TransactionController class with the specified TransactionService.
     * @param {TransactionService} transactionService - The TransactionService that will be used to perform the operations.
     */
    constructor(@inject(TYPES.TransactionService) transactionService: TransactionService) {
        super(transactionService);
    }

    // Add user-specific HTTP handlers here if needed
}
