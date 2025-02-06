// services/userService.ts
import { User } from '@prisma/client';
import { BaseService } from './baseService';
import { UserRepository } from '../repositories/userRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';

@injectable()
export class UserService extends BaseService<User> {
    /**
     * Initializes a new instance of the UserService class with the specified
     * UserRepository instance.
     *
     * @param {UserRepository} userRepository - The UserRepository instance to use
     *   for database operations.
     */
    constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
        super(userRepository);
    }

    /**
     * Finds a user by their email address.
     *
     * @param {string} email - The email of the user to find.
     *
     * @returns {Promise<User | null>} A promise that resolves with the user
     * object if a user with the specified email is found, or null if no such
     * user exists.
     */
    async findUserByEmail(email: string): Promise<User | null> {
        const users = await this.repository.findAll();
        return users.find(user => user.email === email) || null;
    }

    /**
     * Checks if a user with the specified email exists in the database.
     *
     * @param {string} email - The email of the user to check.
     *
     * @returns {Promise<boolean>} A promise that resolves with a boolean indicating
     * whether a user with the specified email exists or not.
     */
    async checkEmailExists(email: string): Promise<boolean> {
        const user = await this.findUserByEmail(email);
        return !!user;
    }

    /**
     * Hashes a password using the bcryptjs library. The number of salt rounds
     * is determined by the value of the SALT_ROUNDS environment variable.
     *
     * @param {string} password - The password to hash.
     *
     * @returns {Promise<string>} A promise that resolves with the hashed password.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, loadEnvironmentVariable('SALT_ROUNDS'));
    }

    /**
     * Compares a plain text password with a hashed password to determine if they match.
     *
     * @param {string} plainPassword - The plain text password to compare.
     * @param {string} hashedPassword - The hashed password to compare against.
     *
     * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, or false otherwise.
     */
    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Creates a new verified user with the provided user data. The user's password
     * is hashed before being stored in the database.
     *
     * @param {Partial<User>} userData - Partial user data containing at least
     * an email and password.
     *
     * @returns {Promise<User>} A promise that resolves with the newly created
     * user object.
     *
     * @throws {Error} If the email or password is not provided in the user data.
     */
    async createVerifiedUser(userData: Partial<User>): Promise<User> {
        if (!userData.email || !userData.password) {
            throw new Error("Email and password are required");
        }
        const hashedPassword = await this.hashPassword(userData.password);
        return this.repository.create({ ...userData, password: hashedPassword } as User);
    }

    /**
     * Generates a JWT token for the given user ID and email.
     *
     * @param {string} userId - The ID of the user to generate a token for.
     * @param {string} email - The email of the user to generate a token for.
     *
     * @returns {string} The generated JWT token.
     */
    generateToken(userId: string, email: string): string {
        return jwt.sign({ userId, email }, loadEnvironmentVariable('JWT_SECRET'), { expiresIn: '1h' });
    }
}
