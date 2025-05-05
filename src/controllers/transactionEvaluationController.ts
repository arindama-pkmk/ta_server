// src/controllers/evaluationController.ts
import { Response } from 'express';
import { BaseController } from './baseController';
import { Evaluation } from '@prisma/client';
import { TransactionEvaluationService } from '../services/transactionEvaluationService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { AuthRequest } from 'auth';

@injectable()
export class TransactionEvaluationController extends BaseController<Evaluation> {
    constructor(@inject(TYPES.TransactionEvaluationService) service: TransactionEvaluationService) {
        super(service);
    }

    override async findAll(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.id;
            const { start, end } = req.query;
            const result = await (
                this.service as TransactionEvaluationService
            ).getHistories(
                userId,
                start ? new Date(start as string) : undefined,
                end ? new Date(end as string) : undefined
            );
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    }

    override async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.id;
            const data = {
                ...req.body,
                userId,
            };
            const result = await (this.service as TransactionEvaluationService).createHistory(data);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    }
}
