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
    constructor(@inject(TYPES.TransactionController) transactionController: TransactionController) {
        super(transactionController, [
            validateZod(createTransactionValidationSchema),
        ]);

        this.router.get('/category/:category', transactionController.getTransactionsByCategory.bind(transactionController));
        this.router.get('/subcategory/:subcategory', transactionController.getTransactionsBySubcategory.bind(transactionController));
        this.router.get('/date-range', transactionController.getTransactionsByDateRange.bind(transactionController));
        this.router.get('/summary', transactionController.getTransactionSummary.bind(transactionController));
        this.router.post('/:id/bookmark', transactionController.bookmarkTransaction.bind(transactionController));
    }
}
