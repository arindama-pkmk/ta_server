// src/routes/transactionRoutes.ts
import { Transaction } from '@prisma/client';
import { TransactionController } from '../controllers/transactionController';
import { BaseRoutes } from './baseRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import { createTransactionValidationSchema } from '../validators/transactionValidator';

@injectable()
export class TransactionRoutes extends BaseRoutes<Transaction> {
    /**
     * Initializes a new instance of the TransactionRoutes class with the specified
     * TransactionController instance.
     *
     * @param {TransactionController} transactionController - The TransactionController instance to use
     *   for handling transaction-related operations.
     */
    constructor(@inject(TYPES.TransactionController) transactionController: TransactionController) {
        super(transactionController, [
            validateZod(createTransactionValidationSchema),
        ]);
    }
}
