// src/routes/index.ts
import { Application, Request, Response } from 'express';
import { UserRoutes } from './userRoutes';
import { TransactionRoutes } from './transactionRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { HealthController } from '../controllers/healthController';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';
import { authenticate } from '../middlewares/authMiddleware';
import { ClassifierController } from '../controllers/classifierController';

@injectable()
export class Routes {
    private readonly userRoutes: UserRoutes;
    private readonly transactionRoutes: TransactionRoutes;
    private readonly healthController: HealthController;
    private readonly classifierController: ClassifierController;

    /**
     * Initializes a new instance of the Routes class with the specified UserRoutes and HealthController instances.
     *
     * @param {UserRoutes} userRoutes - The UserRoutes instance to be used for handling user-related operations.
     * @param {HealthController} healthController - The HealthController instance to be used for handling health-related operations.
     * @param {TransactionRoutes} transactionRoutes - The TransactionRoutes instance to be used for handling transaction-related operations.
     * @param {ClassifierController} classifierController - The ClassifierController instance to be used for handling classifier-related operations.
     */
    constructor(
        @inject(TYPES.UserRoutes) userRoutes: UserRoutes,
        @inject(TYPES.TransactionRoutes) transactionRoutes: TransactionRoutes,
        @inject(TYPES.HealthController) healthController: HealthController,
        @inject(TYPES.ClassifierController) classifierController: ClassifierController) {
        this.userRoutes = userRoutes;
        this.transactionRoutes = transactionRoutes;
        this.healthController = healthController;
        this.classifierController = classifierController;
    }

    /**
     * Registers the routes for the API.
     *
     * This method registers the routes for the API. It registers the root route ('/'), the health route ('/health'), and the user-related routes ('/users').
     *
     * @param {Application} app - The Express Application instance to register the routes with.
     */
    register(app: Application) {
        const basePath = loadEnvironmentVariable('API_BASE_PATH') || '/api/v1';

        app.get(`${basePath}/`, (_req: Request, res: Response) => {
            res.json({ message: 'Welcome to the API' });
        });

        app.get(`${basePath}/status`, async (req, res) => {
            await this.healthController.getStatus(req, res);
        })

        app.get(`${basePath}/health`, authenticate, async (req, res) => {
            await this.healthController.getHealthStatus(req, res);
        });

        // classify
        app.post(`${basePath}/transactions/classify`, async (req, res) => {
            await this.classifierController.classifyTransaction(req, res);
        });

        app.use(`${basePath}/users`, authenticate, this.userRoutes.getRouter());
        app.use(`${basePath}/transactions`, /*authenticate,*/ this.transactionRoutes.getRouter());
    }
}
