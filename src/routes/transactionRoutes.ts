// src/routes/transactionRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { authenticate } from '../middlewares/authMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transactionValidator';
import { AuthRequest } from '../types/auth'; // For correct typing in route handlers

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
        // All transaction routes are authenticated
        this.router.use(authenticate);

        this.router.post('/',
            validateZod(createTransactionSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.createTransaction(req as AuthRequest, res, next)
        );

        this.router.get('/',
            (req: Request, res: Response, next: NextFunction) => this.controller.getAllTransactions(req as AuthRequest, res, next)
        );

        this.router.get('/summary', // Summary for the authenticated user
            (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionSummary(req as AuthRequest, res, next)
        );

        // Note: For routes like /category/:categoryName, it's usually better to use IDs if possible.
        // If names are used, the controller/service needs to handle name-to-ID resolution.
        // These specific getters might be redundant if getAllTransactions handles filtering well.
        // this.router.get('/by-category/:categoryName', 
        //     (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionsByCategoryName(req as AuthRequest, res, next));
        // this.router.get('/by-subcategory/:subcategoryName', 
        //     (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionsBySubcategoryName(req as AuthRequest, res, next));

        // This route for date range is effectively covered by GET / with query params
        // this.router.get('/by-date-range', 
        //    (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionsByDateRange(req as AuthRequest, res, next));


        this.router.get('/:id',
            (req: Request, res: Response, next: NextFunction) => this.controller.getTransactionById(req as AuthRequest, res, next)
        );

        this.router.put('/:id',
            validateZod(updateTransactionSchema),
            (req: Request, res: Response, next: NextFunction) => this.controller.updateTransaction(req as AuthRequest, res, next)
        );

        this.router.delete('/:id',
            (req: Request, res: Response, next: NextFunction) => this.controller.deleteTransaction(req as AuthRequest, res, next)
        );

        this.router.post('/:id/bookmark',
            (req: Request, res: Response, next: NextFunction) => this.controller.bookmarkTransaction(req as AuthRequest, res, next)
        );
    }
}