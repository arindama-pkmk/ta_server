// src/routes/userRoutes.ts
import { User } from '@prisma/client';
import { UserController } from '../controllers/userController';
import { BaseRoutes } from './baseRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import { createUserValidationSchema, updateUserValidationSchema } from '../validators/userValidator';

@injectable()
export class UserRoutes extends BaseRoutes<User> {
    /**
     * Initializes a new instance of the UserRoutes class with the specified
     * UserController instance.
     *
     * @param {UserController} userController - The UserController instance to use
     *   for handling user-related operations.
     */
    constructor(@inject(TYPES.UserController) userController: UserController) {
        super(userController, [
            validateZod(createUserValidationSchema),
            validateZod(updateUserValidationSchema),
        ]);

        this.router.post('/login', userController.login.bind(userController));
        this.router.post('/register', userController.register.bind(userController));
    }
}
