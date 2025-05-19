// src/routes/userRoutes.ts
import { Router, Request, Response, NextFunction } from 'express'; // Added NextFunction
import { UserController } from '../controllers/userController';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import {
    registerUserSchema,
    loginUserSchema,
    updateUserProfileSchema,
    // resetPasswordSchema
    // createUserValidationSchema // If you have a separate admin create user
} from '../validators/userValidator';
import { authenticate } from '../middlewares/authMiddleware';
import { AuthRequest } from 'auth';

@injectable()
export class UserRoutes {
    public router: Router;
    private readonly userController: UserController;

    constructor(@inject(TYPES.UserController) userController: UserController) {
        this.router = Router();
        this.userController = userController;
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {
        // Public routes
        this.router.post('/login',
            validateZod(loginUserSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.login(req, res, next)
        );
        this.router.post('/register',
            validateZod(registerUserSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.register(req, res, next)
        );
        /// this.router.post('/reset-password',
        ///     validateZod(resetPasswordSchema),
        ///     (req: Request, res: Response, next: NextFunction) => this.userController.resetPassword(req, res, next)
        /// );

        // Authenticated routes
        this.router.get('/profile',
            authenticate,
            (req: Request, res: Response, next: NextFunction) => this.userController.getProfile(req as AuthRequest, res, next)
        );
        this.router.put('/profile',
            authenticate,
            validateZod(updateUserProfileSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.updateProfile(req as AuthRequest, res, next)
        );
        this.router.delete('/profile/me', // More specific route for self-deletion
            authenticate,
            (req: Request, res: Response, next: NextFunction) => this.userController.deleteCurrentUserAccount(req as AuthRequest, res, next)
        );

        // Example: Admin-only routes for generic user management (if needed later)
        // const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => { /* check admin role */ next(); };
        // this.router.post('/', authenticate, adminOnly, validateZod(createUserValidationSchema), (req,res,next)=> this.userController.adminCreateUser(req,res,next));
        // this.router.get('/', authenticate, adminOnly, (req,res,next)=> this.userController.adminGetAllUsers(req,res,next));
        // this.router.get('/:id', authenticate, adminOnly, (req,res,next)=> this.userController.adminGetUserById(req,res,next));
        // this.router.put('/:id', authenticate, adminOnly, validateZod(updateUserValidationSchema), (req,res,next)=> this.userController.adminUpdateUser(req,res,next));
        // this.router.delete('/:id', authenticate, adminOnly, (req,res,next)=> this.userController.adminDeleteUser(req,res,next));
    }
}