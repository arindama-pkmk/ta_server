import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { Routes } from '../routes/index'
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { UserRoutes } from '../routes/userRoutes';
import { TYPES } from './types';
import { HealthController } from '../controllers/healthController';
import { TransactionRepository } from '../repositories/transactionRepository';
import { TransactionService } from '../services/transactionService';
import { TransactionController } from '../controllers/transactionController';
import { TransactionRoutes } from '../routes/transactionRoutes';
import { ClassifierController } from '../controllers/classifierController';

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());

container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<UserRoutes>(TYPES.UserRoutes).to(UserRoutes);

container.bind<TransactionRepository>(TYPES.TransactionRepository).to(TransactionRepository);
container.bind<TransactionService>(TYPES.TransactionService).to(TransactionService);
container.bind<TransactionController>(TYPES.TransactionController).to(TransactionController);
container.bind<TransactionRoutes>(TYPES.TransactionRoutes).to(TransactionRoutes);

container.bind<ClassifierController>(TYPES.ClassifierController).to(ClassifierController);

container.bind<HealthController>(TYPES.HealthController).to(HealthController);

container.bind<Routes>(TYPES.Routes).to(Routes);

export { container };
