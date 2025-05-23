// src/routes/transactionBudgetingRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionBudgetingController } from '../controllers/transactionBudgetingController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { getIncomeSummaryForDatesSchema, saveExpenseAllocationsSchema } from '../validators/budgetValidator';
// Import DTOs for specific BudgetAllocation CRUD if you create Zod schemas for them
// import { createBudgetAllocationSchema, updateBudgetAllocationSchema } from '../validators/budgetValidator';
import { AuthRequest } from '../types/auth'; // Corrected import

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
        this.router.use(authenticate);

        /**
         * @openapi
         * /budgeting/plans:
         *   get:
         *     tags:
         *       - Budgeting Plans
         *     summary: Get all budget plans for the user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: startDate
         *         schema: { type: string, format: date }
         *         description: Optional start date to filter plans.
         *       - in: query
         *         name: endDate
         *         schema: { type: string, format: date }
         *         description: Optional end date to filter plans.
         *     responses:
         *       '200':
         *         description: A list of budget plans.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetPlanListResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.get('/plans',
            (req: Request, res: Response, next: NextFunction) => this.controller.getBudgetPlans(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /budgeting/plans/{budgetPlanId}:
         *   get:
         *     tags:
         *       - Budgeting Plans
         *     summary: Get details of a specific budget plan
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: budgetPlanId
         *         required: true
         *         schema: { type: string, format: uuid }
         *     responses:
         *       '200':
         *         description: Budget plan details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetPlanResponse'
         *       '401': { description: "Unauthorized" }
         *       '404': { description: "Budget plan not found" }
         */
        this.router.get('/plans/:budgetPlanId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getBudgetPlanDetails(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /budgeting/income-summary:
         *   get:
         *     tags:
         *       - Budgeting Core
         *     summary: Get summarized income for a specific date range
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
         *         description: Income summary.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/IncomeSummaryResponse'
         *       '400': { description: "Invalid date range" }
         *       '401': { description: "Unauthorized" }
         */
        this.router.get('/income-summary',
            // validateZod(getIncomeSummaryForDatesSchema), // Zod for query params needs custom handling or separate middleware
            (req: Request, res: Response, next: NextFunction) => this.controller.getIncomeSummaryForDateRange(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /budgeting/expense-category-suggestions:
         *   get:
         *     tags:
         *       - Budgeting Core
         *     summary: Get expense category suggestions
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '200':
         *         description: List of suggestions.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ExpenseCategorySuggestionResponse'
         *       '401': { description: "Unauthorized" }
         */
        this.router.get('/expense-category-suggestions',
            (req: Request, res: Response, next: NextFunction) => this.controller.getExpenseCategorySuggestions(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /budgeting/expense-allocations:
         *   post:
         *     tags:
         *       - Budgeting Core
         *     summary: Save a budget plan with its expense allocations
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/SaveExpenseAllocationsPayload'
         *     responses:
         *       '201':
         *         description: Budget plan and allocations saved successfully.
         *         content:
         *           application/json:
         *             schema: # Returns the created BudgetPlan with its allocations
         *               type: object
         *               properties:
         *                  success: { type: boolean }
         *                  message: { type: string }
         *                  data: { $ref: '#/components/schemas/BudgetPlan' }
         *       '400': { description: "Invalid input" }
         *       '401': { description: "Unauthorized" }
         */
        this.router.post('/expense-allocations',
            validateZod(saveExpenseAllocationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.saveExpenseAllocations(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /budgeting/allocations:
         *   get:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Get all expense allocations for a specific budget plan
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: budgetPlanId
         *         required: true
         *         schema: { type: string, format: uuid }
         *     responses:
         *       '200':
         *         description: List of expense allocations.
         *         content:
         *           application/json:
         *             schema:
         *                type: object
         *                properties:
         *                  success: { type: boolean }
         *                  data:
         *                    type: array
         *                    items: { $ref: '#/components/schemas/ExpenseAllocation' }
         *       '400': { description: "Missing budgetPlanId" }
         *       '401': { description: "Unauthorized" }
         *       '404': { description: "Budget plan not found" }
         */
        this.router.get('/allocations',
            // Consider Zod validation for query.budgetPlanId if needed
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllocationsForBudgetPlan(req as AuthRequest, res, next)
        );
    }
}