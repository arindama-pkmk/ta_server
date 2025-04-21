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
    constructor(@inject(TYPES.UserController) userController: UserController) {
        super(userController, [
            validateZod(createUserValidationSchema),
            validateZod(updateUserValidationSchema),
        ]);

        this.router.post('/login', userController.login.bind(userController));
        this.router.post('/register', userController.register.bind(userController));
    }
}
