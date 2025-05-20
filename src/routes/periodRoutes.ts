// src/routes/periodRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { PeriodController } from '../controllers/periodController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { periodSchema } from '../validators/budgetValidator';
import { AuthRequest } from '../types/auth'; // Corrected import

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
        this.router.use(authenticate);

        /**
         * @openapi
         * /periods:
         *   post:
         *     tags:
         *       - Periods
         *     summary: Create a new period
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CreatePeriodPayload'
         *     responses:
         *       '201':
         *         description: Period created successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/PeriodResponse'
         *       '400':
         *         description: Invalid input data or period conflict.
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
            validateZod(periodSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.createPeriod(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /periods:
         *   get:
         *     tags:
         *       - Periods
         *     summary: Get all periods for the authenticated user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: type
         *         schema:
         *           type: string
         *           enum: [income, expense, general_evaluation]
         *         description: Filter periods by type.
         *     responses:
         *       '200':
         *         description: A list of periods.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/PeriodListResponse'
         *       '401':
         *         description: Unauthorized.
         */
        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => this.controller.getPeriods(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /periods/{periodId}:
         *   get:
         *     tags:
         *       - Periods
         *     summary: Get a specific period by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: periodId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the period.
         *     responses:
         *       '200':
         *         description: Period details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/PeriodResponse'
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found or access denied.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.getPeriodById(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /periods/{periodId}:
         *   put:
         *     tags:
         *       - Periods
         *     summary: Update an existing period
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: periodId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the period to update.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/UpdatePeriodPayload' # Or periodSchema in Zod, map to a new schema here
         *     responses:
         *       '200':
         *         description: Period updated successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/PeriodResponse'
         *       '400':
         *         description: Invalid input data or period conflict.
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse' # If using periodSchema() and Zod validates it
         *                 - $ref: '#/components/schemas/ErrorResponse' # For other errors
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found or access denied.
         */
        this.router.put('/:periodId',
            validateZod(periodSchema), // Use schema for updates
            (req: Request, res: Response, next: NextFunction) => this.controller.updatePeriod(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /periods/{periodId}:
         *   delete:
         *     tags:
         *       - Periods
         *     summary: Delete a period (soft delete)
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: periodId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the period to delete.
         *     responses:
         *       '204':
         *         description: Period deleted successfully. No content.
         *       '401':
         *         description: Unauthorized.
         *       '404':
         *         description: Period not found or access denied.
         */
        this.router.delete('/:periodId',
            (req: Request, res: Response, next: NextFunction) => this.controller.deletePeriod(req as AuthRequest, res, next)
        );
    }
}