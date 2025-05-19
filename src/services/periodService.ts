// src/services/periodService.ts
import { Period } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import { differenceInDays } from 'date-fns';
import { PeriodRepository, CreatePeriodDto, UpdatePeriodDto } from '../repositories/periodRepository';
import { BadRequestError, NotFoundError } from '../utils/errorHandler';
import logger from '../utils/logger';

@injectable()
export class PeriodService {
    private readonly periodRepository: PeriodRepository;

    constructor(@inject(TYPES.PeriodRepository) periodRepository: PeriodRepository) {
        this.periodRepository = periodRepository;
    }

    public validatePeriodDatesLogic(startDate: Date, endDate: Date, periodType: Period['periodType']): void {
        if (!startDate || !endDate) {
            throw new BadRequestError("Start date and end date must be provided.");
        }
        if (endDate < startDate) {
            throw new BadRequestError("End date cannot be before start date.");
        }

        const diffDays = differenceInDays(endDate, startDate);

        if (periodType === 'income' || periodType === 'expense') { // Budgeting periods
            if (diffDays > 31) { // Max 1 month (+1 day for inclusivity, e.g. 30 days is 0-29)
                throw new BadRequestError("Budgeting period range cannot exceed approximately 1 month (31 days).");
            }
        } else if (periodType === 'general_evaluation') { // Evaluation periods
            if (diffDays < 29) { // Min 1 month (e.g. 0-29 is 30 days)
                throw new BadRequestError("Evaluation period range must be at least 1 month (30 days).");
            }
        }
        // No specific validation for other types yet, or add them here
    }

    async createPeriod(createDto: CreatePeriodDto, userId: string): Promise<Period> {
        this.validatePeriodDatesLogic(createDto.startDate, createDto.endDate, createDto.periodType);

        // PSPEC: Check for existing identical period for the same user (uniq_user_period_dates_type)
        const existing = await this.periodRepository.findExisting(userId, createDto.startDate, createDto.endDate, createDto.periodType);
        if (existing) {
            throw new BadRequestError(`A period with these exact dates and type already exists for this user (ID: ${existing.id}).`); // Or 409 Conflict
        }

        logger.info(`[PeriodService] Creating new period for user ${userId}, type ${createDto.periodType}`);
        return this.periodRepository.create(createDto, userId);
    }

    async getPeriodById(periodId: string, userId: string): Promise<Period> {
        const period = await this.periodRepository.findByIdAndUserId(periodId, userId);
        if (!period) {
            throw new NotFoundError(`Period with ID ${periodId} not found or access denied.`);
        }
        return period;
    }

    async getPeriodsForUser(userId: string, periodType?: Period['periodType']): Promise<Period[]> {
        logger.info(`[PeriodService] Fetching periods for user ${userId}, type ${periodType ?? 'all'}`);
        return this.periodRepository.findByUserAndType(userId, periodType);
    }

    async updatePeriod(periodId: string, updateDto: UpdatePeriodDto, userId: string): Promise<Period> {
        const existingPeriod = await this.periodRepository.findByIdAndUserId(periodId, userId);
        if (!existingPeriod) {
            throw new NotFoundError(`Period with ID ${periodId} not found or access denied for update.`);
        }

        const newStartDate = updateDto.startDate || existingPeriod.startDate;
        const newEndDate = updateDto.endDate || existingPeriod.endDate;
        const newPeriodType = updateDto.periodType ?? existingPeriod.periodType;
        this.validatePeriodDatesLogic(newStartDate, newEndDate, newPeriodType);

        // Check for duplicates if dates/type are changing to something that already exists
        if ((updateDto.startDate || updateDto.endDate || updateDto.periodType) &&
            !(newStartDate === existingPeriod.startDate && newEndDate === existingPeriod.endDate && newPeriodType === existingPeriod.periodType)) {
            const conflictingPeriod = await this.periodRepository.findExisting(userId, newStartDate, newEndDate, newPeriodType);
            if (conflictingPeriod && conflictingPeriod.id !== periodId) {
                throw new BadRequestError(`An updated period with these exact dates and type would conflict with an existing period(ID: ${conflictingPeriod.id}).`); // Or 409
            }
        }

        logger.info(`[PeriodService] Updating period ${periodId} for user ${userId}`);
        return this.periodRepository.update(periodId, updateDto);
    }

    async deletePeriod(periodId: string, userId: string): Promise<void> {
        const existingPeriod = await this.periodRepository.findByIdAndUserId(periodId, userId);
        if (!existingPeriod) {
            throw new NotFoundError(`Period with ID ${periodId} not found or access denied for deletion.`);
        }

        // Business logic: What happens to BudgetAllocations or EvaluationResults linked to this Period?
        // Prisma's onDelete: Cascade on Period for these related tables will handle deletion if hard-deleting Period.
        // If soft-deleting Period, you might need to cascade soft deletes here within a transaction.
        // For now, assuming soft delete of Period only.

        logger.info(`[PeriodService] Soft - deleting period ${periodId} for user ${userId}`);
        await this.periodRepository.softDelete(periodId);
        // If hard delete is needed: await this.periodRepository.hardDelete(periodId);
    }

    // ensureAndGetPeriod (used by BudgetingService/EvaluationService)
    async ensureAndGetPeriod(
        userId: string,
        startDate: Date,
        endDate: Date,
        periodType: Period['periodType'],
        description?: string | null,
        existingPeriodId?: string | null, // If client thinks a period might exist
    ): Promise<Period> {
        this.validatePeriodDatesLogic(startDate, endDate, periodType);

        // 1. If an existingPeriodId is provided, try to fetch and validate it
        if (existingPeriodId) {
            const existing = await this.periodRepository.findByIdAndUserId(existingPeriodId, userId);
            if (existing &&
                existing.startDate.getTime() === startDate.getTime() && // Compare time for exact match
                existing.endDate.getTime() === endDate.getTime() &&
                existing.periodType === periodType) {
                logger.info(`[PeriodService] Ensured existing period ${existingPeriodId} for user ${userId}`);
                return existing;
            }
            // If ID provided but doesn't match criteria or user, it's an issue or we create new
            logger.warn(`[PeriodService] existingPeriodId ${existingPeriodId} provided but did not match criteria or user.Will attempt to find / create.`);
        }

        // 2. Try to find an identical active period for this user
        const identicalPeriod = await this.periodRepository.findExisting(userId, startDate, endDate, periodType);
        if (identicalPeriod) {
            logger.info(`[PeriodService] Found identical existing period ${identicalPeriod.id} for user ${userId}`);
            return identicalPeriod;
        }

        // 3. If not found, create a new one
        logger.info(`[PeriodService] Creating new ensured period for user ${userId}, type ${periodType} `);
        return this.periodRepository.create({
            startDate,
            endDate,
            periodType,
            description: description ?? null,
        }, userId);
    }
}