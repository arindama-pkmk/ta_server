// src/controllers/transactionEvaluationController.ts
import { Response, NextFunction } from 'express';
import {
    TransactionEvaluationService,
    CalculateEvaluationClientDto, // Import DTOs
} from '../services/transactionEvaluationService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { AuthRequest } from '../types/auth';
import { UnauthorizedError, BadRequestError } from '../utils/errorHandler';
// Import Zod schemas from evaluationValidator.ts

@injectable()
export class TransactionEvaluationController {
    private readonly evaluationService: TransactionEvaluationService;

    constructor(@inject(TYPES.TransactionEvaluationService) evaluationService: TransactionEvaluationService) {
        this.evaluationService = evaluationService;
    }

    async calculateEvaluationsForPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            // Zod validation for req.body (e.g., calculateEvaluationsSchema) by middleware
            const { periodId } = req.body as Pick<CalculateEvaluationClientDto, 'periodId'>;
            if (!periodId) throw new BadRequestError("periodId is required in the request body.");

            const dto: CalculateEvaluationClientDto = { periodId }; // Only periodId is expected in DTO

            const results = await this.evaluationService.calculateAndStoreEvaluations(dto, req.user.id); // Pass userId too
            res.status(200).json({ success: true, message: "Evaluations calculated and stored.", data: results });
        } catch (error) {
            next(error);
        }
    }

    async getEvaluationHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { startDate, endDate } = req.query;
            const history = await this.evaluationService.getEvaluationHistoryForUser(
                req.user.id,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );
            res.status(200).json({ success: true, data: history });
        } catch (error) {
            next(error);
        }
    }

    async getEvaluationDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { evaluationResultId } = req.params; // Assuming ID of EvaluationResult record
            if (!evaluationResultId) throw new BadRequestError("evaluationResultId is required in the request parameters.");
            const detail = await this.evaluationService.getEvaluationDetailById(evaluationResultId, req.user.id);
            res.status(200).json({ success: true, data: detail });
        } catch (error) {
            next(error);
        }
    }

    // If you need basic CRUD for EvaluationResult (less common, as they are calculated)
    // async deleteEvaluationResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
    //         const { evaluationResultId } = req.params;
    //         await this.evaluationService.deleteUserEvaluationResult(evaluationResultId, req.user.id); // New service method
    //         res.status(204).send();
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}