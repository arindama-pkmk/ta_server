import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { BaseController } from './baseController';
import { UserService } from '../services/userService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { AuthRequest } from 'auth';

@injectable()
export class UserController extends BaseController<User> {
    constructor(@inject(TYPES.UserService) userService: UserService) {
        super(userService);
    }

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

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { name, username, email, address, birthdate, occupation, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required.' });
                return;
            }
            const userService = this.service as UserService;
            const newUser = await userService.createVerifiedUser({ name, username, email, address, birthdate, occupation, password });
            res.status(201).json({ success: true, user: newUser });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userService = this.service as UserService;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const user = await userService.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            res.status(200).json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userService = this.service as UserService;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const updatedUser = await userService.update(userId, req.body);
            res.status(200).json({ success: true, user: updatedUser });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

}
