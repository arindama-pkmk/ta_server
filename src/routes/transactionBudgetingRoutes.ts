// src/routes/transactionBudgetingRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionBudgetingController } from '../controllers/transactionBudgetingController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { saveExpenseAllocationsSchema } from '../validators/budgetValidator';
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
         * /transaction-budgeting/income-summary/{periodId}:
         *   get:
         *     tags:
         *       - Budgeting
         *     summary: Get summarized income for a specific period
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: periodId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the period for which to summarize income.
         *     responses:
         *       '200':
         *         description: Income summary retrieved successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/IncomeSummaryResponse'
         *       '400':
         *         description: Invalid periodId or period is not of type 'income' or 'general_evaluation'.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found.
         */
        this.router.get('/income-summary/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getIncomeSummaryForPeriod(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting/expense-category-suggestions:
         *   get:
         *     tags:
         *       - Budgeting
         *     summary: Get expense category allocation suggestions based on user occupation
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '200':
         *         description: Expense category suggestions retrieved successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ExpenseCategorySuggestionResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: User not found (should not happen for authenticated user).
         *       '500':
         *         description: Critical data missing (e.g., 'Pengeluaran' AccountType).
         */
        this.router.get('/expense-category-suggestions',
            (req: Request, res: Response, next: NextFunction) => this.controller.getExpenseCategorySuggestions(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting/expense-allocations:
         *   post:
         *     tags:
         *       - Budgeting
         *     summary: Save expense allocations for a budget period
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
         *         description: Budget plan saved successfully. Returns the saved allocations.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/SaveExpenseAllocationsResponse'
         *       '400':
         *         description: Invalid input data, period type mismatch, or percentage mismatch.
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period or Category not found.
         */
        this.router.post('/expense-allocations',
            validateZod(saveExpenseAllocationsSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.saveExpenseAllocations(req as AuthRequest, res, next)
        );

        // CRUD for individual BudgetAllocation records
        /**
         * @openapi
         * /transaction-budgeting:
         *   post:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Create a new budget allocation record
         *     description: Manually create a single budget allocation. Usually, allocations are managed via `POST /expense-allocations`.
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CreateBudgetAllocationPayload'
         *     responses:
         *       '201':
         *         description: Budget allocation created.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetAllocationResponse'
         *       '400':
         *         description: Invalid input or subcategory does not belong to category.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found.
         */
        this.router.post('/',
            // validateZod(createBudgetAllocationSchema), // Add Zod schema if enabling direct creation
            (req: Request, res: Response, next: NextFunction) => this.controller.createAllocation(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting:
         *   get:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Get all budget allocations for a period
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: periodId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the period to fetch allocations for.
         *     responses:
         *       '200':
         *         description: A list of budget allocations for the period.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetAllocationListResponse'
         *       '400':
         *         description: Missing or invalid periodId.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found.
         */
        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllocationsForPeriod(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting/{allocationId}:
         *   get:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Get a specific budget allocation by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: allocationId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the budget allocation.
         *     responses:
         *       '200':
         *         description: Budget allocation details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetAllocationResponse'
         *       '400':
         *         description: Missing allocationId parameter.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Budget allocation or its period not found/access denied.
         */
        this.router.get('/:allocationId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllocationById(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting/{allocationId}:
         *   put:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Update an existing budget allocation
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: allocationId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the budget allocation to update.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/UpdateBudgetAllocationPayload'
         *     responses:
         *       '200':
         *         description: Budget allocation updated.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BudgetAllocationResponse'
         *       '400':
         *         description: Invalid input data or missing allocationId.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Budget allocation or its period not found/access denied.
         */
        this.router.put('/:allocationId',
            // validateZod(updateBudgetAllocationSchema), // Add Zod schema if enabling
            (req: Request, res: Response, next: NextFunction) => this.controller.updateAllocation(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transaction-budgeting/{allocationId}:
         *   delete:
         *     tags:
         *       - Budgeting Allocations (CRUD)
         *     summary: Delete a budget allocation (soft delete)
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: allocationId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the budget allocation to delete.
         *     responses:
         *       '204':
         *         description: Budget allocation deleted. No content.
         *       '400':
         *         description: Missing allocationId parameter.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Budget allocation or its period not found/access denied.
         */
        this.router.delete('/:allocationId',
            (req: Request, res: Response, next: NextFunction) => this.controller.deleteAllocation(req as AuthRequest, res, next)
        );
    }
}