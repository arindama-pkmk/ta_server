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
    private readonly controller: TransactionEvaluationController;

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
         *     summary: Calculate and store financial evaluations for a given date range
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CalculateEvaluationsPayload' # This now expects startDate, endDate
         *     responses:
         *       '200':
         *         description: Evaluations calculated and stored successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/CalculateEvaluationsResponse'
         *       '400': { description: "Invalid input (e.g., date range issues)" }
         *       '401': { description: "Unauthorized" }
         */
        this.router.post('/calculate',
            validateZod(calculateEvaluationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.calculateEvaluationsForDateRange(req as AuthRequest, res, next)
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
         *         schema: { type: string, format: date }
         *       - in: query
         *         name: endDate
         *         schema: { type: string, format: date }
         *     responses:
         *       '200':
         *         description: Evaluation history (list of EvaluationResult).
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/EvaluationHistoryListResponse'
         *       '401': { description: "Unauthorized" }
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
         *     summary: Get detailed info for a specific evaluation result
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: evaluationResultId
         *         required: true
         *         schema: { type: string, format: uuid }
         *     responses:
         *       '200':
         *         description: Evaluation detail.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/EvaluationDetailResponse'
         *       '401': { description: "Unauthorized" }
         *       '404': { description: "Evaluation result not found" }
         */
        this.router.get('/:evaluationResultId/detail',
            (req: Request, res: Response, next: NextFunction) => this.controller.getEvaluationDetail(req as AuthRequest, res, next)
        );

        /**
        * @openapi
        * /evaluations/check-existence:
        *   get:
        *     tags:
        *       - Evaluations
        *     summary: Check if evaluation results exist for a given date range
        *     security:
        *       - bearerAuth: []
        *     parameters:
        *       - in: query
        *         name: startDate
        *         required: true
        *         schema: { type: string, format: date }
        *       - in: query
        *         name: endDate
        *         required: true
        *         schema: { type: string, format: date }
        *     responses:
        *       '200':
        *         description: Indicates if results exist. If so, data contains the results.
        *         content:
        *           application/json:
        *             schema:
        *               type: object
        *               properties:
        *                 success: { type: boolean }
        *                 exists: { type: boolean }
        *                 data: { type: 'array', items: { $ref: '#/components/schemas/EvaluationResult' }, nullable: true }
        *       '401': { description: "Unauthorized" }
        *       '404': { description: "Evaluation result not found" }
        */
        this.router.get('/check-existence', // Or a more descriptive path
            (req: Request, res: Response, next: NextFunction) => this.controller.checkExistingEvaluationForDateRange(req as AuthRequest, res, next)
        );
    }
}