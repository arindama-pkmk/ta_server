// src/routes/index.ts
import { Express, Request, Response } from 'express';
import { UserRoutes } from './userRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { HealthController } from '../controllers/healthController';

@injectable()
export class Routes {
    private readonly userRoutes: UserRoutes;
    private readonly healthController: HealthController;

    /**
     * Initializes a new instance of the Routes class with the specified UserRoutes and HealthController instances.
     *
     * @param {UserRoutes} userRoutes - The UserRoutes instance to be used for handling user-related operations.
     * @param {HealthController} healthController - The HealthController instance to be used for handling health-related operations.
     */
    constructor(
        @inject(TYPES.UserRoutes) userRoutes: UserRoutes,
        @inject(TYPES.HealthController) healthController: HealthController) {
        this.userRoutes = userRoutes;
        this.healthController = healthController;
    }

    /**
     * Registers all routes of the API with the specified Express application.
     *
     * @param {Express} app - The Express application to which the routes should be registered.
     */
    register(app: Express) {
        app.get('/', (_req: Request, res: Response) => {
            res.json({ message: 'Welcome to the API' });
        });

        app.get('/health', async (req, res) => {
            await this.healthController.getHealthStatus(req, res);
        });

        app.use('/users', this.userRoutes.getRouter());
    }
}
