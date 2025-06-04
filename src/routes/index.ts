// src/routes/index.ts
import { Application, NextFunction, Request, Response } from 'express';
import { UserRoutes } from './userRoutes';
import { TransactionRoutes } from './transactionRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { HealthController } from '../controllers/healthController';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';
import { authenticate } from '../middlewares/authMiddleware';
import { ClassifierController } from '../controllers/classifierController';
import { TransactionEvaluationRoutes } from './transactionEvaluationRoutes';
import { validateZod } from '../middlewares/validationMiddleware';
import { classifyTransactionTextSchema } from '../validators/classifyValidator';
import { TransactionBudgetingRoutes } from './transactionBudgetingRoutes';
import { CategoryHierarchyRoutes } from './categoryHierarchyRoutes'; // Added import

@injectable()
export class Routes {
    private readonly userRoutes: UserRoutes;
    private readonly transactionRoutes: TransactionRoutes;
    private readonly transactionEvaluationRoutes: TransactionEvaluationRoutes;
    private readonly transactionBudgetingRoutes: TransactionBudgetingRoutes;
    private readonly categoryHierarchyRoutes: CategoryHierarchyRoutes; // Added property
    private readonly healthController: HealthController;
    private readonly classifierController: ClassifierController;

    constructor(
        @inject(TYPES.UserRoutes) userRoutes: UserRoutes,
        @inject(TYPES.TransactionRoutes) transactionRoutes: TransactionRoutes,
        @inject(TYPES.TransactionEvaluationRoutes) transactionEvaluationRoutes: TransactionEvaluationRoutes,
        @inject(TYPES.TransactionBudgetingRoutes) transactionBudgetingRoutes: TransactionBudgetingRoutes,
        @inject(TYPES.CategoryHierarchyRoutes) categoryHierarchyRoutes: CategoryHierarchyRoutes, // Added injection
        @inject(TYPES.HealthController) healthController: HealthController,
        @inject(TYPES.ClassifierController) classifierController: ClassifierController,
    ) {
        this.userRoutes = userRoutes;
        this.transactionRoutes = transactionRoutes;
        this.transactionEvaluationRoutes = transactionEvaluationRoutes;
        this.transactionBudgetingRoutes = transactionBudgetingRoutes;
        this.categoryHierarchyRoutes = categoryHierarchyRoutes; // Added assignment
        this.healthController = healthController;
        this.classifierController = classifierController;
    }

    register(app: Application) {
        const basePath = loadEnvironmentVariable('API_BASE_PATH') || '/api/v1';

        /**
         * @openapi
         * /:
         *   get:
         *     tags:
         *       - General
         *     summary: Welcome endpoint for the API
         *     responses:
         *       '200':
         *         description: A welcome message.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Welcome to the API
         */
        app.get(`${basePath}/`, (_req: Request, res: Response) => {
            res.json({ message: 'Welcome to the API' });
        });

        /**
         * @openapi
         * /status:
         *   get:
         *     tags:
         *       - Health
         *     summary: Gets the basic application status
         *     responses:
         *       '200':
         *         description: Application is running.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BasicStatusResponse'
         *       '500':
         *         description: Application status check failed (should be rare for this simple endpoint).
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        app.get(`${basePath}/status`, async (req, res, next) => {
            await this.healthController.getStatus(req, res, next);
        })

        /**
         * @openapi
         * /health:
         *   get:
         *     tags:
         *       - Health
         *     summary: Gets detailed health status of the application and its services
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '200':
         *         description: System is healthy.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/HealthStatusResponse'
         *       '503':
         *         description: Service unavailable (e.g., database connection issue).
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/HealthStatusResponse' # Still returns health status object
         *       '401':
         *         description: Unauthorized.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        app.get(`${basePath}/health`, authenticate, async (req, res, next) => {
            await this.healthController.getHealthStatus(req, res, next);
        });

        /**
         * @openapi
         * /transactions/classify:
         *   post:
         *     tags:
         *       - Transactions ML Classifier
         *     summary: Classifies a transaction description using an ML model
         *     security:
         *       - bearerAuth: [] # Assuming user context might be relevant for ML
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/ClassifyPayload'
         *     responses:
         *       '200':
         *         description: Classification result. Success may be true or false based on confidence/matching.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ClassifierResponse'
         *       '400':
         *         description: Invalid input (e.g., empty text).
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorValidationResponse'
         *       '401':
         *         description: Unauthorized.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '500':
         *         description: Internal server error or ML service error.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '502':
         *         description: Bad Gateway - Error from ML service.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '503':
         *         description: Service Unavailable - ML service unreachable or timed out.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        app.post(`${basePath}/transactions/classify`,
            authenticate,
            validateZod(classifyTransactionTextSchema),
            (req: Request, res: Response, next: NextFunction) => this.classifierController.classifyTransaction(req, res, next)
        );

        // Mount other routes
        app.use(`${basePath}/users`, this.userRoutes.getRouter());
        app.use(`${basePath}/transactions`, this.transactionRoutes.getRouter());
        app.use(`${basePath}/budgeting`, this.transactionBudgetingRoutes.getRouter());
        app.use(`${basePath}/evaluations`, this.transactionEvaluationRoutes.getRouter());
        app.use(`${basePath}/category-hierarchy`, this.categoryHierarchyRoutes.getRouter()); // Added mounting
    }
}