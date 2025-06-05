// src/controllers/transactionEvaluationController.ts
import { Response, NextFunction } from 'express';
import {
    TransactionEvaluationService,
    CalculateEvaluationClientDto,
} from '../services/transactionEvaluationService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { AuthRequest } from '../types/auth';
import { UnauthorizedError, BadRequestError } from '../utils/errorHandler';

@injectable()
export class TransactionEvaluationController {
    private readonly evaluationService: TransactionEvaluationService;

    constructor(@inject(TYPES.TransactionEvaluationService) evaluationService: TransactionEvaluationService) {
        this.evaluationService = evaluationService;
    }

    async calculateEvaluationsForDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            // Zod validation (calculateEvaluationsSchema) now expects startDate and endDate
            const { startDate, endDate } = req.body as CalculateEvaluationClientDto; // DTO now has dates
            if (!startDate || !endDate) { // Basic check, Zod handles detailed
                throw new BadRequestError("startDate and endDate are required in the request body.");
            }

            const results = await this.evaluationService.calculateAndStoreEvaluations(
                { startDate: new Date(startDate), endDate: new Date(endDate) }, // Ensure they are Date objects
                req.user.id
            );
            res.status(200).json({ success: true, message: "Evaluations calculated and stored.", data: results });
        } catch (error) {
            next(error);
        }
    }

    async getEvaluationHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { startDate, endDate } = req.query; // These are optional filters for history
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
        // This remains largely the same as it fetches a specific EvaluationResult by its ID
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { evaluationResultId } = req.params;
            if (!evaluationResultId) throw new BadRequestError("evaluationResultId is required.");
            const detail = await this.evaluationService.getEvaluationDetailById(evaluationResultId, req.user.id);
            res.status(200).json({ success: true, data: detail });
        } catch (error) {
            next(error);
        }
    }

    async checkExistingEvaluationForDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
            const { startDate, endDate } = req.query; // Expect ISO date strings
            if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
                throw new BadRequestError("startDate and endDate query parameters are required.");
            }

            const existingResults = await this.evaluationService.findEvaluationsByDateRange(
                req.user.id,
                new Date(startDate),
                new Date(endDate)
            );

            if (existingResults.length > 0) {
                // Could return the first found result ID or just a boolean
                res.status(200).json({ success: true, exists: true, data: existingResults }); // Send back the data for pre-filling
            } else {
                res.status(200).json({ success: true, exists: false });
            }
        } catch (error) {
            next(error);
        }
    }
}