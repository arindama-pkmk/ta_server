// src/services/userService.ts
import { User, Occupation } from '@prisma/client';
import { UserRepository, CreateUserDto, UpdateUserDto } from '../repositories/userRepository'; // Import DTOs
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errorHandler';
import prisma from '../config/database'; // For $transaction
import logger from '../utils/logger';

@injectable()
export class UserService {
    private readonly userRepository: UserRepository;

    constructor(
        @inject(TYPES.UserRepository) userRepository: UserRepository,
    ) {
        this.userRepository = userRepository;
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = parseInt(loadEnvironmentVariable('SALT_ROUNDS') || '10');
        return bcrypt.hash(password, saltRounds);
    }

    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    generateToken(userId: string, email: string): string {
        const secret = loadEnvironmentVariable('JWT_SECRET');
        const expiresInRaw = loadEnvironmentVariable('JWT_EXPIRATION_TIME');
        const expiresIn = parseInt(expiresInRaw, 10) || 3600; // default to 1 hour if cannot parse
        return jwt.sign({ id: userId, email: email }, secret, { expiresIn });
    }

    // PSPEC 1.1: Register
    async registerUser(userData: CreateUserDto): Promise<User> {
        if (!userData.email || !userData.password || !userData.username || !userData.name) {
            throw new BadRequestError("Name, username, email, and password are required for registration.");
        }
        if (userData.password.length < 6) {
            throw new BadRequestError("Password must be at least 6 characters long.");
        }

        const existingByEmail = await this.userRepository.findByEmail(userData.email);
        if (existingByEmail) {
            throw new BadRequestError("Email is already registered."); // Or 409 Conflict
        }
        const existingByUsername = await this.userRepository.findByUsername(userData.username);
        if (existingByUsername) {
            throw new BadRequestError("Username is already taken."); // Or 409 Conflict
        }

        // Validate occupationId if provided
        if (userData.occupationId) {
            const occupation = await prisma.occupation.findUnique({ where: { id: userData.occupationId } });
            if (!occupation) {
                throw new BadRequestError(`Occupation with ID ${userData.occupationId} not found.`);
            }
        }


        const hashedPassword = await this.hashPassword(userData.password);
        const userToCreate: CreateUserDto = {
            ...userData,
            password: hashedPassword,
        };
        return this.userRepository.create(userToCreate);
    }

    // PSPEC 1.2: Login
    async loginUser(emailOrUsername: string, plainPassword: string): Promise<{ user: Omit<User, 'password'> & { occupation?: Occupation | null }, token: string }> {
        let user: (User & { occupation?: Occupation | null }) | null = null;
        if (emailOrUsername.includes('@')) {
            user = await this.userRepository.findByEmail(emailOrUsername, true);
        } else {
            user = await this.userRepository.findByUsername(emailOrUsername, true);
        }

        if (!user || user.deletedAt !== null) { // Also check if soft-deleted
            throw new UnauthorizedError('Invalid credentials or user not found.');
        }

        const passwordMatch = await this.comparePassword(plainPassword, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedError('Invalid credentials.');
        }

        const token = this.generateToken(user.id, user.email);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user; // Exclude password from response
        return { user: userWithoutPassword, token };
    }

    // PSPEC 5.1: View Profile (scoped to authenticated user)
    async getUserProfile(userId: string): Promise<Omit<User, 'password'> & { occupation?: Occupation | null }> {
        const user = await this.userRepository.findById(userId, true); // Include occupation
        if (!user) {
            throw new NotFoundError('User profile not found.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // PSPEC 5.2: Edit Profile (scoped to authenticated user)
    async updateUserProfile(userId: string, updateData: UpdateUserDto): Promise<Omit<User, 'password'> & { occupation?: Occupation | null }> {
        const userToUpdate = await this.userRepository.findById(userId); // findById now includes occupation if requested, but not needed here
        if (!userToUpdate) {
            throw new NotFoundError('User not found for profile update.');
        }

        // Uniqueness check for username if it's being changed
        if (updateData.username && updateData.username !== userToUpdate.username) {
            const existingByUsername = await this.userRepository.findByUsername(updateData.username);
            if (existingByUsername && existingByUsername.id !== userId) {
                throw new BadRequestError("Username is already taken."); // Or 409 Conflict
            }
        }
        // Validate new occupationId if provided
        if (updateData.occupationId) {
            const occupation = await prisma.occupation.findUnique({ where: { id: updateData.occupationId } });
            if (!occupation) {
                throw new BadRequestError(`Occupation with ID ${updateData.occupationId} not found.`);
            }
        }

        // Use the specific updateProfile method in repository
        const updatedUser = await this.userRepository.updateProfile(userId, updateData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    // For password reset flow - Step 3
    // async resetPasswordWithOtp(email: string, otp: string, newPasswordPlainText: string): Promise<Omit<User, 'password'>> { // Return type fixed
    //     await this.otpService.verifyOtp(email, otp);

    //     const user = await this.userRepository.findByEmail(email);
    //     if (!user || user.deletedAt) {
    //         throw new NotFoundError("User with this email not found or is inactive.");
    //     }

    //     if (!newPasswordPlainText || newPasswordPlainText.length < 6) {
    //         throw new BadRequestError("New password must be at least 6 characters long.");
    //     }
    //     const newHashedPassword = await this.hashPassword(newPasswordPlainText);

    //     // Call the new specific repository method
    //     const updatedUser = await this.userRepository.updatePassword(user.id, newHashedPassword);
    //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //     const { password, ...userWithoutPassword } = updatedUser;
    //     return userWithoutPassword;
    // }

    // Soft delete user and potentially related data (cascading logic)
    async deleteUser(userIdToDelete: string, currentUserId: string): Promise<void> {
        if (userIdToDelete !== currentUserId) {
            // TODO: Implement admin role check here if admins should be able to delete other users
            throw new ForbiddenError("Users can only delete their own accounts.");
        }

        const user = await this.userRepository.findById(userIdToDelete);
        if (!user || user.deletedAt) { // Check if already soft-deleted
            throw new NotFoundError("User not found or already deleted.");
        }

        await prisma.$transaction(async (tx) => {
            // 1. Soft delete Transactions
            await tx.transaction.updateMany({
                where: { userId: userIdToDelete, deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // 2. Soft delete BudgetPlans (this will cascade to ExpenseAllocations if schema is set up for it,
            //    otherwise, soft delete ExpenseAllocations explicitly first)
            //    Let's assume onDelete: Cascade on BudgetPlan for ExpenseAllocation is NOT soft delete aware
            //    So we need to do it manually.

            // Find all BudgetPlans for the user
            const userBudgetPlans = await tx.budgetPlan.findMany({
                where: { userId: userIdToDelete, deletedAt: null },
                select: { id: true }
            });
            const budgetPlanIds = userBudgetPlans.map(bp => bp.id);

            if (budgetPlanIds.length > 0) {
                // Soft delete ExpenseAllocations linked to these BudgetPlans
                await tx.expenseAllocation.updateMany({
                    where: { budgetPlanId: { in: budgetPlanIds }, deletedAt: null },
                    data: { deletedAt: new Date() }
                });
            }
            // Now soft delete the BudgetPlans themselves
            await tx.budgetPlan.updateMany({
                where: { userId: userIdToDelete, deletedAt: null },
                data: { deletedAt: new Date() }
            });


            // 3. Soft delete EvaluationResults
            await tx.evaluationResult.updateMany({
                where: { userId: userIdToDelete, deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // // 4. Soft delete OTPs linked to this user
            // await tx.otpVerification.updateMany({
            //     where: { userId: userIdToDelete, deletedAt: null },
            //     data: { deletedAt: new Date() }
            // });

            // 5. Finally, soft delete the user record itself
            await tx.user.update({
                where: { id: userIdToDelete },
                data: { deletedAt: new Date() },
            });
        });
        logger.info(`[UserService] Soft-deleted user ${userIdToDelete} and related data.`);
    }

    // Simple findById for internal use or admin
    async findUserById(id: string): Promise<User | null> {
        return this.userRepository.findById(id, true); // Include occupation
    }

    async getAllOccupations(): Promise<Occupation[]> {
        return this.userRepository.findAllOccupations();
    }
}