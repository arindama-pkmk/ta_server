// src/routes/categoryHierarchyRoutes.ts
import { Router, Response, NextFunction, Request } from 'express';
import { CategoryHierarchyController } from '../controllers/categoryHierarchyController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';

@injectable()
export class CategoryHierarchyRoutes {
    public router: Router;
    private readonly controller: CategoryHierarchyController;

    constructor(@inject(TYPES.CategoryHierarchyController) controller: CategoryHierarchyController) {
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
         * /category-hierarchy/account-types:
         *   get:
         *     tags:
         *       - Category Hierarchy
         *     summary: Get all account types
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '200':
         *         description: A list of account types.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/AccountTypeListResponse'
         *       '401':
         *         description: Unauthorized
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/account-types',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllAccountTypes(req, res, next));

        /**
         * @openapi
         * /category-hierarchy/categories:
         *   get:
         *     tags:
         *       - Category Hierarchy
         *     summary: Get categories by account type ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: accountTypeId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the account type.
         *     responses:
         *       '200':
         *         description: A list of categories for the given account type.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/CategoryListResponse'
         *       '400':
         *         description: Missing or invalid accountTypeId.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized
         *       '404':
         *         description: AccountType not found.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/categories',
            (req: Request, res: Response, next: NextFunction) => this.controller.getCategories(req, res, next));

        /**
         * @openapi
         * /category-hierarchy/subcategories:
         *   get:
         *     tags:
         *       - Category Hierarchy
         *     summary: Get subcategories by category ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: categoryId
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: The ID of the category.
         *     responses:
         *       '200':
         *         description: A list of subcategories for the given category.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/SubcategoryListResponse'
         *       '400':
         *         description: Missing or invalid categoryId.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized
         *       '404':
         *         description: Category not found.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/subcategories',
            (req: Request, res: Response, next: NextFunction) => this.controller.getSubcategories(req, res, next));
    }
}