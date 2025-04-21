import { BaseController } from './baseController';
import { Allocation } from '@prisma/client';
import { TransactionBudgetingService } from '../services/transactionBudgetingService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionBudgetingController extends BaseController<Allocation> {
    constructor(@inject(TYPES.TransactionBudgetingService) service: TransactionBudgetingService) {
        super(service);
    }

    // You can override or extend base methods if needed:
    // async findAll(req: Request, res: Response) { ... }
}
