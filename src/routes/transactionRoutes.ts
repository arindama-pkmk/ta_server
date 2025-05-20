// src/routes/transactionRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transactionValidator';
import { AuthRequest } from '../types/auth'; // Corrected import

@injectable()
export class TransactionRoutes {
    public router: Router;
    private readonly controller: TransactionController;

    constructor(@inject(TYPES.TransactionController) controller: TransactionController) {
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
         * /transactions:
         *   post:
         *     tags:
         *       - Transactions
         *     summary: Create a new transaction
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CreateTransactionPayload'
         *     responses:
         *       '201':
         *         description: Transaction created successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionResponse'
         *       '400':
         *         description: Invalid input data or subcategory not found.
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.post('/',
            validateZod(createTransactionSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.createTransaction(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions:
         *   get:
         *     tags:
         *       - Transactions
         *     summary: Get all transactions for the authenticated user
         *     description: Retrieves a list of transactions, with optional filtering and pagination.
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: startDate
         *         schema:
         *           type: string
         *           format: date
         *         description: Filter transactions from this date (inclusive).
         *       - in: query
         *         name: endDate
         *         schema:
         *           type: string
         *           format: date
         *         description: Filter transactions up to this date (inclusive).
         *       - in: query
         *         name: categoryId
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Filter by category ID.
         *       - in: query
         *         name: subcategoryId
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Filter by subcategory ID.
         *       - in: query
         *         name: isBookmarked
         *         schema:
         *           type: boolean
         *         description: Filter by bookmark status.
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           minimum: 1
         *         description: Page number for pagination.
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           minimum: 1
         *         description: Number of items per page for pagination.
         *     responses:
         *       '200':
         *         description: A list of transactions.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionListResponse'
         *       '400':
         *         description: Invalid filter or pagination parameters.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllTransactions(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions/summary:
         *   get:
         *     tags:
         *       - Transactions
         *     summary: Get a summary of transactions for the authenticated user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: startDate
         *         schema:
         *           type: string
         *           format: date
         *         description: Start date for the summary period.
         *       - in: query
         *         name: endDate
         *         schema:
         *           type: string
         *           format: date
         *         description: End date for the summary period.
         *     responses:
         *       '200':
         *         description: Transaction summary.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionSummaryResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.get('/summary',
            (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionSummary(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions/{id}:
         *   get:
         *     tags:
         *       - Transactions
         *     summary: Get a specific transaction by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the transaction.
         *     responses:
         *       '200':
         *         description: Transaction details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Transaction not found or access denied.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/:id',
            (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionById(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions/{id}:
         *   put:
         *     tags:
         *       - Transactions
         *     summary: Update an existing transaction
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the transaction to update.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/UpdateTransactionPayload'
         *     responses:
         *       '200':
         *         description: Transaction updated successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionResponse'
         *       '400':
         *         description: Invalid input data or subcategory not found.
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Transaction not found or access denied.
         */
        this.router.put('/:id',
            validateZod(updateTransactionSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.updateTransaction(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions/{id}:
         *   delete:
         *     tags:
         *       - Transactions
         *     summary: Delete a transaction (soft delete)
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the transaction to delete.
         *     responses:
         *       '204':
         *         description: Transaction deleted successfully. No content.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Transaction not found or access denied.
         */
        this.router.delete('/:id',
            (req: Request, res: Response, next: NextFunction) => this.controller.deleteTransaction(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /transactions/{id}/bookmark:
         *   post:
         *     tags:
         *       - Transactions
         *     summary: Toggle the bookmark status of a transaction
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the transaction to bookmark/unbookmark.
         *     responses:
         *       '200':
         *         description: Transaction bookmark status updated. Returns the updated transaction.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/TransactionResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Transaction not found or access denied.
         */
        this.router.post('/:id/bookmark',
            (req: Request, res: Response, next: NextFunction) => this.controller.bookmarkTransaction(req as AuthRequest, res, next)
        );
    }
}