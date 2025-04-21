// src/routes/transactionEvaluationRoutes.ts
import { Evaluation } from '@prisma/client';
import { TransactionEvaluationController } from '../controllers/transactionEvaluationController';
import { BaseRoutes } from './baseRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
// import { validateZod } from '../middlewares/validationMiddleware';
// import { createTransactionValidationSchema } from '../validators/transactionValidator';

@injectable()
export class TransactionEvaluationRoutes extends BaseRoutes<Evaluation> {
    constructor(@inject(TYPES.TransactionEvaluationController) transactionEvaluationController: TransactionEvaluationController) {
        super(transactionEvaluationController, [
            // validateZod(createTransactionValidationSchema),
        ]);
    }
}
