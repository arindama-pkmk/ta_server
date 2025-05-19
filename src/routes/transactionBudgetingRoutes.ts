// src/routes/transactionBudgetingRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionBudgetingController } from '../controllers/transactionBudgetingController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { saveExpenseAllocationsSchema } from '../validators/budgetValidator'; // Import relevant Zod schemas
// Import DTOs for specific BudgetAllocation CRUD if you create Zod schemas for them
// import { createBudgetAllocationSchema, updateBudgetAllocationSchema } from '../validators/budgetValidator';
import { AuthRequest } from '../types/auth';

@injectable()
export class TransactionBudgetingRoutes {
    public router: Router;
    private readonly controller: TransactionBudgetingController;

    constructor(@inject(TYPES.TransactionBudgetingController) controller: TransactionBudgetingController) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {
        // All budgeting routes are authenticated
        this.router.use(authenticate);

        // Core Budgeting Flow Endpoints
        this.router.get('/income-summary/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getIncomeSummaryForPeriod(req as AuthRequest, res, next)
        );
        this.router.get('/expense-category-suggestions',
            (req: Request, res: Response, next: NextFunction) => this.controller.getExpenseCategorySuggestions(req as AuthRequest, res, next)
        );
        this.router.post('/expense-allocations',
            validateZod(saveExpenseAllocationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.saveExpenseAllocations(req as AuthRequest, res, next)
        );

        // CRUD for individual BudgetAllocation records (if needed directly by client)
        // These would need their own Zod schemas for create/update DTOs
        this.router.post('/',
            // validateZod(createBudgetAllocationSchema), 
            (req: Request, res: Response, next: NextFunction) => this.controller.createAllocation(req as AuthRequest, res, next)
        );
        this.router.get('/', // Gets all allocations for the user based on filters, e.g., query by periodId
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllocationsForPeriod(req as AuthRequest, res, next)
        );
        this.router.get('/:allocationId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllocationById(req as AuthRequest, res, next)
        );
        this.router.put('/:allocationId',
            // validateZod(updateBudgetAllocationSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.updateAllocation(req as AuthRequest, res, next)
        );
        this.router.delete('/:allocationId',
            (req: Request, res: Response, next: NextFunction) => this.controller.deleteAllocation(req as AuthRequest, res, next)
        );
    }
}