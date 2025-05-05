// src/routes/transactionBudgetingRoutes.ts
import { Allocation } from '@prisma/client';
import { BaseRoutes } from './baseRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { TransactionBudgetingController } from '../controllers/transactionBudgetingController';

@injectable()
export class TransactionBudgetingRoutes extends BaseRoutes<Allocation> {
    constructor(@inject(TYPES.TransactionBudgetingController) allocationController: TransactionBudgetingController) {
        super(allocationController, []);
    }
}
