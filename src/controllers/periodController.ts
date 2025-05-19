// src/controllers/periodController.ts
import { Response, NextFunction } from 'express';
import { PeriodService } from '../services/periodService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { AuthRequest } from '../types/auth';
import { CreatePeriodDto, UpdatePeriodDto } from '../repositories/periodRepository';
import { Period } from '@prisma/client'; // For periodType typing
import { UnauthorizedError } from '../utils/errorHandler';

@injectable()
export class PeriodController {
    private readonly periodService: PeriodService;

    constructor(@inject(TYPES.PeriodService) periodService: PeriodService) {
        this.periodService = periodService;
    }

    async createPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.'); // Should be caught by middleware
            }
            // Zod validation for req.body (using periodSchema) would be applied by middleware
            const createDto = req.body as CreatePeriodDto;
            const newPeriod = await this.periodService.createPeriod(createDto, req.user.id);
            res.status(201).json({ success: true, data: newPeriod });
        } catch (error) {
            next(error);
        }
    }

    async getPeriods(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            const periodType = req.query['type'] as Period['periodType'] | undefined;
            const periods = await this.periodService.getPeriodsForUser(req.user.id, periodType);
            res.status(200).json({ success: true, data: periods });
        } catch (error) {
            next(error);
        }
    }

    async getPeriodById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            const { periodId } = req.params;
            if (!periodId) {
                throw new Error('Missing periodId parameter.');
            }
            const period = await this.periodService.getPeriodById(periodId, req.user.id);
            res.status(200).json({ success: true, data: period });
        } catch (error) {
            next(error);
        }
    }

    async updatePeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            const { periodId } = req.params;
            if (!periodId) {
                throw new Error('Missing periodId parameter.');
            }
            // Zod validation for req.body (using periodSchema.partial()) by middleware
            const updateDto = req.body as UpdatePeriodDto;
            const updatedPeriod = await this.periodService.updatePeriod(periodId, updateDto, req.user.id);
            res.status(200).json({ success: true, data: updatedPeriod });
        } catch (error) {
            next(error);
        }
    }

    async deletePeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                throw new UnauthorizedError('Authentication required.');
            }
            const { periodId } = req.params;
            if (!periodId) {
                throw new Error('Missing periodId parameter.');
            }
            await this.periodService.deletePeriod(periodId, req.user.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}