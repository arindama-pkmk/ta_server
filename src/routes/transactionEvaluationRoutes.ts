// src/routes/transactionEvaluationRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionEvaluationController } from '../controllers/transactionEvaluationController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import { calculateEvaluationsSchema } from '../validators/evaluationValidator';
import { AuthRequest } from '../types/auth'; // Corrected import
import { authenticate } from '../middlewares/authMiddleware'; // Added for route protection

@injectable()
export class TransactionEvaluationRoutes {
    public router: Router;
    private controller: TransactionEvaluationController;

    constructor(@inject(TYPES.TransactionEvaluationController) controller: TransactionEvaluationController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {
        this.router.use(authenticate); // Apply authentication to all evaluation routes

        /**
         * @openapi
         * /evaluations/calculate:
         *   post:
         *     tags:
         *       - Evaluations
         *     summary: Calculate and store financial evaluations for a period
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CalculateEvaluationsPayload'
         *     responses:
         *       '200':
         *         description: Evaluations calculated and stored successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/CalculateEvaluationsResponse'
         *       '400':
         *         description: Invalid input data (e.g., periodId missing or invalid period type).
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found.
         *       '500':
         *         description: Internal error (e.g., no ratio definitions found).
         */
        this.router.post('/calculate',
            validateZod(calculateEvaluationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.calculateEvaluationsForPeriod(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /evaluations/history:
         *   get:
         *     tags:
         *       - Evaluations
         *     summary: Get the history of financial evaluations for the user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: startDate
         *         schema:
         *           type: string
         *           format: date
         *         description: Filter history for periods starting on or after this date.
         *       - in: query
         *         name: endDate
         *         schema:
         *           type: string
         *           format: date
         *         description: Filter history for periods ending on or before this date.
         *     responses:
         *       '200':
         *         description: Evaluation history retrieved successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/EvaluationHistoryResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.get('/history',
            (req: Request, res: Response, next: NextFunction) => this.controller.getEvaluationHistory(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /evaluations/{evaluationResultId}/detail:
         *   get:
         *     tags:
         *       - Evaluations
         *     summary: Get detailed information for a specific evaluation result
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: evaluationResultId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the EvaluationResult record.
         *     responses:
         *       '200':
         *         description: Evaluation detail retrieved successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/EvaluationDetailResponse'
         *       '400':
         *         description: Missing evaluationResultId parameter.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Evaluation result not found or access denied.
         *       '500':
         *         description: Evaluation result is missing critical relation data.
         */
        this.router.get('/:evaluationResultId/detail',
            (req: Request, res: Response, next: NextFunction) => this.controller.getEvaluationDetail(req as AuthRequest, res, next)
        );
    }
}