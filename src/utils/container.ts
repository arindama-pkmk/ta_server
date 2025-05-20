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
import { ClassifierService } from '../services/classifierService';
import { OtpVerificationRepository } from '../repositories/otpVerificationRepository';
import { OtpVerificationService } from '../services/otpVerificationService';
import { OtpVerificationController } from '../controllers/otpVerificationController';
import { TransactionEvaluationRepository } from '../repositories/transactionEvaluationRepository';
import { TransactionEvaluationService } from '../services/transactionEvaluationService';
import { TransactionEvaluationController } from '../controllers/transactionEvaluationController';
import { TransactionEvaluationRoutes } from '../routes/transactionEvaluationRoutes';
import { TransactionBudgetingRepository } from '../repositories/transactionBudgetingRepository';
import { TransactionBudgetingService } from '../services/transactionBudgetingService';
import { TransactionBudgetingController } from '../controllers/transactionBudgetingController';
import { TransactionBudgetingRoutes } from '../routes/transactionBudgetingRoutes';
import { PeriodRepository } from '../repositories/periodRepository';
import { PeriodService } from '../services/periodService';
import { PeriodController } from '../controllers/periodController';
import { PeriodRoutes } from '../routes/periodRoutes';
// Import CategoryHierarchy components
import { CategoryHierarchyRepository } from '../repositories/categoryHierarchyRepository'; // Should already be there
import { CategoryHierarchyService } from '../services/categoryHierarchyService';       // Should already be there
import { CategoryHierarchyController } from '../controllers/categoryHierarchyController'; // Should already be there
import { CategoryHierarchyRoutes } from '../routes/categoryHierarchyRoutes';       // <<< IMPORT THIS

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

container.bind<TransactionEvaluationRepository>(TYPES.TransactionEvaluationRepository).to(TransactionEvaluationRepository);
container.bind<TransactionEvaluationService>(TYPES.TransactionEvaluationService).to(TransactionEvaluationService);
container.bind<TransactionEvaluationController>(TYPES.TransactionEvaluationController).to(TransactionEvaluationController);
container.bind<TransactionEvaluationRoutes>(TYPES.TransactionEvaluationRoutes).to(TransactionEvaluationRoutes);

container.bind<TransactionBudgetingRepository>(TYPES.TransactionBudgetingRepository).to(TransactionBudgetingRepository);
container.bind<TransactionBudgetingService>(TYPES.TransactionBudgetingService).to(TransactionBudgetingService);
container.bind<TransactionBudgetingController>(TYPES.TransactionBudgetingController).to(TransactionBudgetingController);
container.bind<TransactionBudgetingRoutes>(TYPES.TransactionBudgetingRoutes).to(TransactionBudgetingRoutes);

container.bind<OtpVerificationRepository>(TYPES.OtpVerificationRepository).to(OtpVerificationRepository);
container.bind<OtpVerificationService>(TYPES.OtpVerificationService).to(OtpVerificationService);
container.bind<OtpVerificationController>(TYPES.OtpVerificationController).to(OtpVerificationController);

container.bind<ClassifierController>(TYPES.ClassifierController).to(ClassifierController);
container.bind<ClassifierService>(TYPES.ClassifierService).to(ClassifierService);

container.bind<PeriodRepository>(TYPES.PeriodRepository).to(PeriodRepository);
container.bind<PeriodService>(TYPES.PeriodService).to(PeriodService);
container.bind<PeriodController>(TYPES.PeriodController).to(PeriodController);
container.bind<PeriodRoutes>(TYPES.PeriodRoutes).to(PeriodRoutes);

// Bind CategoryHierarchy components
container.bind<CategoryHierarchyRepository>(TYPES.CategoryHierarchyRepository).to(CategoryHierarchyRepository);
container.bind<CategoryHierarchyService>(TYPES.CategoryHierarchyService).to(CategoryHierarchyService);
container.bind<CategoryHierarchyController>(TYPES.CategoryHierarchyController).to(CategoryHierarchyController);
container.bind<CategoryHierarchyRoutes>(TYPES.CategoryHierarchyRoutes).to(CategoryHierarchyRoutes); // <<< ADD THIS BINDING

container.bind<HealthController>(TYPES.HealthController).to(HealthController);

container.bind<Routes>(TYPES.Routes).to(Routes);

export { container };