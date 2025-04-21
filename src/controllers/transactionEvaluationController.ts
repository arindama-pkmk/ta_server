// src/controllers/evaluationController.ts
import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Evaluation } from '@prisma/client';
import { TransactionEvaluationService } from '../services/transactionEvaluationService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionEvaluationController extends BaseController<Evaluation> {
    constructor(@inject(TYPES.TransactionEvaluationService) service: TransactionEvaluationService) {
        super(service);
    }

    // You can override findAll to accept date-range query params
    override async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { start, end } = req.query;
            const where: any = {};
            if (start && end) {
                where.date = {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                };
            }
            const items = await this.service.findAll({ where });
            res.json(items);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    }
}
