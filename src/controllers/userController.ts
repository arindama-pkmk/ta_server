// controllers/UserController.ts
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

    // Add user-specific HTTP handlers here if needed
}
