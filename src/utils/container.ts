import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { Routes } from '../routes/index'
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { UserRoutes } from '../routes/userRoutes';
import { TYPES } from './types';
import { HealthController } from '../controllers/healthController';

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());

container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<UserRoutes>(TYPES.UserRoutes).to(UserRoutes);

container.bind<HealthController>(TYPES.HealthController).to(HealthController);

container.bind<Routes>(TYPES.Routes).to(Routes);

export { container };
