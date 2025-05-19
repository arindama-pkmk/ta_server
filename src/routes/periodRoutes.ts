// src/routes/periodRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { PeriodController } from '../controllers/periodController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { periodSchema } from '../validators/budgetValidator'; // Assuming periodSchema is here
import { AuthRequest } from 'auth';

@injectable()
export class PeriodRoutes {
    public router: Router;
    private readonly controller: PeriodController;

    constructor(@inject(TYPES.PeriodController) controller: PeriodController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {
        // All period routes should be authenticated
        this.router.use(authenticate);

        this.router.post('/',
            validateZod(periodSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.createPeriod(req as AuthRequest, res, next)
        );

        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => this.controller.getPeriods(req as AuthRequest, res, next)
        );

        this.router.get('/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getPeriodById(req as AuthRequest, res, next)
        );

        this.router.put('/:periodId',
            validateZod(periodSchema), // Use partial schema for updates
            (req: Request, res: Response, next: NextFunction) => this.controller.updatePeriod(req as AuthRequest, res, next)
        );

        this.router.delete('/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.deletePeriod(req as AuthRequest, res, next)
        );
    }
}