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
import { OtpVerificationController } from '../controllers/otpVerificationController';
import { TransactionEvaluationRoutes } from './transactionEvaluationRoutes';
import { validateZod } from '../middlewares/validationMiddleware';
import { requestOtpSchema, verifyOtpSchema } from '../validators/otpValidator';
import { classifyTransactionTextSchema } from '../validators/classifyValidator';
import { PeriodRoutes } from './periodRoutes';
import { TransactionBudgetingRoutes } from './transactionBudgetingRoutes';

@injectable()
export class Routes {
    private readonly userRoutes: UserRoutes;
    private readonly transactionRoutes: TransactionRoutes;
    private readonly transactionEvaluationRoutes: TransactionEvaluationRoutes;
    private readonly transactionBudgetingRoutes: TransactionBudgetingRoutes;
    private readonly periodRoutes: PeriodRoutes;
    private readonly healthController: HealthController;
    private readonly classifierController: ClassifierController;
    private readonly otpController: OtpVerificationController;

    constructor(
        @inject(TYPES.UserRoutes) userRoutes: UserRoutes,
        @inject(TYPES.TransactionRoutes) transactionRoutes: TransactionRoutes,
        @inject(TYPES.TransactionEvaluationRoutes) transactionEvaluationRoutes: TransactionEvaluationRoutes,
        @inject(TYPES.TransactionBudgetingRoutes) transactionBudgetingRoutes: TransactionBudgetingRoutes,
        @inject(TYPES.PeriodRoutes) periodRoutes: PeriodRoutes,
        @inject(TYPES.HealthController) healthController: HealthController,
        @inject(TYPES.ClassifierController) classifierController: ClassifierController,
        @inject(TYPES.OtpVerificationController) otpController: OtpVerificationController,
    ) {
        this.userRoutes = userRoutes;
        this.transactionRoutes = transactionRoutes;
        this.transactionEvaluationRoutes = transactionEvaluationRoutes;
        this.transactionBudgetingRoutes = transactionBudgetingRoutes;
        this.periodRoutes = periodRoutes;
        this.healthController = healthController;
        this.classifierController = classifierController;
        this.otpController = otpController;
    }

    register(app: Application) {
        const basePath = loadEnvironmentVariable('API_BASE_PATH') || '/api/v1';

        app.post(`${basePath}/otp/request`,
            validateZod(requestOtpSchema), // Apply Zod validation
            (req: Request, res: Response, next: NextFunction) => this.otpController.requestOtp(req, res, next)
        );
        app.post(`${basePath}/otp/verify`,
            validateZod(verifyOtpSchema), // Apply Zod validation
            (req: Request, res: Response, next: NextFunction) => this.otpController.verifyOtp(req, res, next)
        );

        app.get(`${basePath}/`, (_req: Request, res: Response) => {
            res.json({ message: 'Welcome to the API' });
        });

        app.get(`${basePath}/status`, async (req, res, next) => {
            await this.healthController.getStatus(req, res, next);
        })

        app.get(`${basePath}/health`, authenticate, async (req, res, next) => {
            await this.healthController.getHealthStatus(req, res, next);
        });

        // classify
        app.post(`${basePath}/transactions/classify`,
            authenticate, // Classification usually needs to know the user for context, or can be public
            validateZod(classifyTransactionTextSchema), // Apply Zod validation
            (req: Request, res: Response, next: NextFunction) => this.classifierController.classifyTransaction(req, res, next)
        );

        app.use(`${basePath}/periods`, this.periodRoutes.getRouter());
        app.use(`${basePath}/users`, this.userRoutes.getRouter());
        app.use(`${basePath}/transactions`, this.transactionRoutes.getRouter());
        app.use(`${basePath}/transaction-budgeting`, this.transactionBudgetingRoutes.getRouter());
        app.use(`${basePath}/transaction-evaluations`, this.transactionEvaluationRoutes.getRouter());
    }
}
