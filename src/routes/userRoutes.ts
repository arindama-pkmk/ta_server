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
    // resetPasswordSchema // Assuming this might be added later
} from '../validators/userValidator';
import { authenticate } from '../middlewares/authMiddleware';
import { AuthRequest } from '../types/auth'; // Corrected import path

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
        /**
         * @openapi
         * /users/login:
         *   post:
         *     tags:
         *       - Users
         *     summary: Logs in a user
         *     description: Authenticates a user based on email/username and password, returning a JWT token and user profile.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/LoginPayload'
         *     responses:
         *       '200':
         *         description: Login successful.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/LoginResponse'
         *       '400':
         *         description: Invalid input data.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorValidationResponse'
         *       '401':
         *         description: Unauthorized - Invalid credentials.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.post('/login',
            validateZod(loginUserSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.login(req, res, next)
        );

        /**
         * @openapi
         * /users/register:
         *   post:
         *     tags:
         *       - Users
         *     summary: Registers a new user
         *     description: Creates a new user account.
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/RegisterPayload'
         *     responses:
         *       '201':
         *         description: User registered successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/RegisterResponse'
         *       '400':
         *         description: Invalid input data (e.g., email/username taken, validation failure).
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse' # For non-Zod errors like "Email already registered"
         */
        this.router.post('/register',
            validateZod(registerUserSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.register(req, res, next)
        );

        // Add for reset-password if re-enabled
        // /**
        //  * @openapi
        //  * /users/reset-password:
        //  *   post:
        //  *     tags:
        //  *       - Users
        //  *     summary: Resets user password using OTP
        //  *     requestBody:
        //  *       required: true
        //  *       content:
        //  *         application/json:
        //  *           schema:
        //  *             $ref: '#/components/schemas/ResetPasswordPayload'
        //  *     responses:
        //  *       '200':
        //  *         description: Password reset successfully.
        //  *         content:
        //  *           application/json:
        //  *             schema:
        //  *               $ref: '#/components/schemas/SuccessMessageResponse'
        //  *       '400':
        //  *         description: Invalid OTP, email, or password format.
        //  *         content:
        //  *           application/json:
        //  *             schema:
        //  *               $ref: '#/components/schemas/ErrorResponse' # Or ErrorValidationResponse
        //  *       '404':
        //  *         description: User not found.
        //  *         content:
        //  *           application/json:
        //  *             schema:
        //  *               $ref: '#/components/schemas/ErrorResponse'
        //  */
        // this.router.post('/reset-password',
        //     validateZod(resetPasswordSchema),
        //     (req: Request, res: Response, next: NextFunction) => this.userController.resetPassword(req, res, next)
        // );

        /**
         * @openapi
         * /users/profile:
         *   get:
         *     tags:
         *       - Users
         *     summary: Gets the current user's profile
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '200':
         *         description: User profile retrieved successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/UserProfileResponse'
         *       '401':
         *         description: Unauthorized - Token missing or invalid.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '404':
         *         description: User profile not found.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.get('/profile',
            authenticate,
            (req: Request, res: Response, next: NextFunction) => this.userController.getProfile(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /users/profile:
         *   put:
         *     tags:
         *       - Users
         *     summary: Updates the current user's profile
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/UpdateProfilePayload'
         *     responses:
         *       '200':
         *         description: User profile updated successfully.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/UserProfileResponse'
         *       '400':
         *         description: Invalid input data or username taken.
         *         content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/ErrorValidationResponse'
         *                 - $ref: '#/components/schemas/ErrorResponse'
         *       '401':
         *         description: Unauthorized.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '404':
         *         description: User not found.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.put('/profile',
            authenticate,
            validateZod(updateUserProfileSchema),
            (req: Request, res: Response, next: NextFunction) => this.userController.updateProfile(req as AuthRequest, res, next)
        );

        /**
         * @openapi
         * /users/profile/me:
         *   delete:
         *     tags:
         *       - Users
         *     summary: Deletes the current user's account
         *     description: Soft deletes the authenticated user's account and related data.
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       '204':
         *         description: User account deleted successfully. No content.
         *       '401':
         *         description: Unauthorized.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       '404':
         *         description: User not found.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         */
        this.router.delete('/profile/me',
            authenticate,
            (req: Request, res: Response, next: NextFunction) => this.userController.deleteCurrentUserAccount(req as AuthRequest, res, next)
        );

        this.router.get('/occupations',
            (req: Request, res: Response, next: NextFunction) => this.userController.getOccupations(req, res, next)
        );
    }
}