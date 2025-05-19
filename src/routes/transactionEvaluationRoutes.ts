// src/routes/transactionEvaluationRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionEvaluationController } from '../controllers/transactionEvaluationController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import { calculateEvaluationsSchema } from '../validators/evaluationValidator'; // Import Zod schema
import { AuthRequest } from '../types/auth';

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
        // All evaluation routes are authenticated (already applied in src/routes/index.ts)
        // this.router.use(authenticate); // Not needed here if applied globally for /evaluations path

        this.router.post('/calculate',
            validateZod(calculateEvaluationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.calculateEvaluationsForPeriod(req as AuthRequest, res, next)
        );

        this.router.get('/history', // GET /api/v1/evaluations/history
            (req: Request, res: Response, next: NextFunction) => this.controller.getEvaluationHistory(req as AuthRequest, res, next)
        );

        this.router.get('/:evaluationResultId/detail', // GET /api/v1/evaluations/{id}/detail
            (req: Request, res: Response, next: NextFunction) => this.controller.getEvaluationDetail(req as AuthRequest, res, next)
        );

        // Example: Delete an evaluation result (if this functionality is desired)
        // this.router.delete('/:evaluationResultId',
        //     (req: Request, res: Response, next: NextFunction) => this.controller.deleteEvaluationResult(req as AuthRequest, res, next)
        // );
    }
}