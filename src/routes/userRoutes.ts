// src/routes/userRoutes.ts
import { User } from '@prisma/client';
import { UserController } from '../controllers/userController';
import { BaseRoutes } from './baseRoutes';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { validateZod } from '../middlewares/validationMiddleware';
import { createUserValidationSchema, updateUserValidationSchema } from '../validators/userValidator';
import { authenticate } from '../middlewares/authMiddleware';
import { RequestHandler } from 'express';

@injectable()
export class UserRoutes extends BaseRoutes<User> {
    constructor(@inject(TYPES.UserController) userController: UserController) {
        super(userController, [
            validateZod(createUserValidationSchema),
            validateZod(updateUserValidationSchema),
        ]);

        this.router.post('/login', userController.login.bind(userController));
        this.router.post('/register', userController.register.bind(userController));
        this.router.get('/profile', authenticate, userController.getProfile.bind(userController) as unknown as RequestHandler);
        this.router.put('/profile', authenticate, validateZod(updateUserValidationSchema), userController.updateProfile.bind(userController) as unknown as RequestHandler);

        this.router.post('/', ...[
            validateZod(createUserValidationSchema),
            validateZod(updateUserValidationSchema),
        ], userController.create.bind(userController));
        this.router.get('/', userController.findAll.bind(userController));
        this.router.get('/:id', userController.findById.bind(userController));
        this.router.put('/:id', ...[
            validateZod(createUserValidationSchema),
            validateZod(updateUserValidationSchema),
        ], userController.update.bind(userController));
        this.router.delete('/:id', userController.delete.bind(userController));
    }
}
