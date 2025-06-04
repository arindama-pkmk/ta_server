// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
/// import { User } from '@prisma/client'; // Keep for type hints if needed
import { UserService } from '../services/userService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { AuthRequest } from '../types/auth'; // Use specific AuthRequest
import { CreateUserDto, UpdateUserDto } from '../repositories/userRepository'; // Import DTOs
import { UnauthorizedError } from '../utils/errorHandler';

@injectable()
export class UserController {
    private readonly userService: UserService;

    constructor(@inject(TYPES.UserService) userService: UserService) {
        this.userService = userService;
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Assumes Zod validation (loginUserSchema) applied by middleware
            const { email, password } = req.body; // 'email' here can be email or username
            const result = await this.userService.loginUser(email, password);
            res.status(200).json({ success: true, token: result.token, user: result.user });
        } catch (error) {
            next(error); // Pass to global error handler
        }
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Assumes Zod validation (registerUserSchema) applied by middleware
            const userData = req.body as CreateUserDto; // Cast after validation

            const newUser = await this.userService.registerUser(userData);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPassword } = newUser; // Don't send password back
            res.status(201).json({ success: true, user: userWithoutPassword });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) { // Should be caught by authenticate middleware, but good check
                throw new UnauthorizedError('Authentication required.');
            }
            const userProfile = await this.userService.getUserProfile(req.user.id);
            res.status(200).json({ success: true, user: userProfile });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            // Assumes Zod validation (updateUserProfileSchema) applied by middleware
            const updateData = req.body as UpdateUserDto;

            const updatedUser = await this.userService.updateUserProfile(req.user.id, updateData);
            res.status(200).json({ success: true, user: updatedUser });
        } catch (error) {
            next(error);
        }
    }

    // async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         // Assumes Zod validation (resetPasswordSchema) applied by middleware
    //         const { email, otp, newPassword } = req.body;
    //         await this.userService.resetPasswordWithOtp(email, otp, newPassword);
    //         res.status(200).json({ success: true, message: "Password has been reset successfully." });
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    async deleteCurrentUserAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            await this.userService.deleteUser(req.user.id, req.user.id); // User deletes themselves
            res.status(204).send(); // No content on successful delete
        } catch (error) {
            next(error);
        }
    }

    async getOccupations(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const occupations = await this.userService.getAllOccupations();
            res.status(200).json({ success: true, data: occupations }); // Wrap in data for consistency
        } catch (error) {
            next(error);
        }
    }

    // Admin/Generic CRUD (if needed, these would require admin role authorization)
    // Example:
    // async adminGetAllUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    //     // Add admin role check here from req.user
    //     try {
    //         const users = await this.userService.findAllUsers({}); // A new service method
    //         res.status(200).json(users);
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}