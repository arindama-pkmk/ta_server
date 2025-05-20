// src/routes/categoryHierarchyRoutes.ts
import { Router, Response, NextFunction, Request } from 'express';
import { CategoryHierarchyController } from '../controllers/categoryHierarchyController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware'; // These are likely needed by authenticated users


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
        this.router.use(authenticate); // Protect these routes

        this.router.get('/account-types',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllAccountTypes(req, res, next));

        this.router.get('/categories', // Expects ?accountTypeId=xxx
            (req: Request, res: Response, next: NextFunction) => this.controller.getCategories(req, res, next));

        this.router.get('/subcategories', // Expects ?categoryId=xxx
            (req: Request, res: Response, next: NextFunction) => this.controller.getSubcategories(req, res, next));
    }
}