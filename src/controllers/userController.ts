import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { BaseController } from './baseController';
import { UserService } from '../services/userService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class UserController extends BaseController<User> {
    /**
     * Initializes a new instance of the UserController class.
     *
     * @param {UserService} userService - The user service to be used for
     * handling user-related operations.
     */
    constructor(@inject(TYPES.UserService) userService: UserService) {
        super(userService);
    }

    /**
     * Handles user login.
     *
     * This method receives an email (or identifier) and password from the request body,
     * validates the user via the userService, and returns a JWT token on success.
     *
     * @param req Express request object
     * @param res Express response object
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const userService = this.service as UserService;
            const user = await userService.findUserByIdentifier(email);

            if (!user || !(await userService.comparePassword(password, user.password))) {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
                return;
            }

            const token = userService.generateToken(user.id, user.email);
            res.status(200).json({ success: true, token, user });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    /**
     * Handles user registration.
     *
     * This method receives registration data from the request body,
     * validates that necessary fields are present, creates a new user,
     * and returns the created user object.
     *
     * @param req Express request object
     * @param res Express response object
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { name, username, email, phone, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required.' });
                return;
            }
            const userService = this.service as UserService;
            const newUser = await userService.createVerifiedUser({ name, username, email, phone, password });
            res.status(201).json({ success: true, user: newUser });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}
