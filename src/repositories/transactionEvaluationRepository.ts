// src/repositories/transactionEvaluationRepository.ts
import { PrismaClient, EvaluationResult, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

// DTO for EvaluationResult Creation - typically all fields are set by the service after calculation
export type CreateEvaluationResultDto = Omit<EvaluationResult, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'ratio' | 'period' | 'user'>;

// DTO for Update - usually only value and status might be updated if re-calculated
export type UpdateEvaluationResultDto = Partial<Pick<EvaluationResult, 'value' | 'status' | 'calculatedAt'>>;

// Define the include object for populated EvaluationResults
const evaluationResultIncludeDefault = {
    ratio: true,
    period: true,
    user: true, // Assuming direct userId link and you want user details sometimes
} satisfies Prisma.EvaluationResultInclude;

// Prisma's way of getting the type with includes
export type PopulatedEvaluationResult = Prisma.EvaluationResultGetPayload<{
    include: typeof evaluationResultIncludeDefault
}>;

@injectable()
export class TransactionEvaluationRepository {
    private readonly prisma: PrismaClient;
    private readonly defaultInclude = evaluationResultIncludeDefault;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // create method not typically called directly with a DTO for EvaluationResult,
    // as it's a result of calculation. Service layer will use upsert or create with specific fields.
    // However, providing a standard create if ever needed:
    async create(data: CreateEvaluationResultDto): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.create({
            data: {
                userId: data.userId,
                periodId: data.periodId,
                ratioId: data.ratioId,
                value: data.value,
                status: data.status,
                calculatedAt: data.calculatedAt || new Date(),
            },
            include: this.defaultInclude,
        });
    }

    async findById(id: string): Promise<PopulatedEvaluationResult | null> {
        return this.prisma.evaluationResult.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: this.defaultInclude,
        });
    }

    // To find an existing result for a specific user, ratio, and period (for upserting)
    async findExisting(userId: string, periodId: string, ratioId: string): Promise<EvaluationResult | null> {
        return this.prisma.evaluationResult.findUnique({
            where: {
                uniq_result_ratio_period: { // Using your defined unique constraint
                    ratioId: ratioId,
                    periodId: periodId,
                },
                // AND ensure it's for the correct user and not soft-deleted
                userId: userId,
                deletedAt: null,
            }
        });
    }

    async findAllByUserId(
        userId: string,
        args?: Omit<Prisma.EvaluationResultFindManyArgs, 'where' | 'include'> & { where?: Prisma.EvaluationResultWhereInput }
    ): Promise<PopulatedEvaluationResult[]> {
        const queryArgs: Prisma.EvaluationResultFindManyArgs = {
            ...args,
            where: {
                ...(args?.where || {}),
                userId, // Direct user scoping
                deletedAt: null,
            },
            include: {
                ratio: true,
                period: true,
                user: true,
            },
            orderBy: args?.orderBy || { calculatedAt: 'desc' },
        };
        return this.prisma.evaluationResult.findMany({ ...queryArgs, include: this.defaultInclude });
    }

    async update(id: string, data: UpdateEvaluationResultDto): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.update({
            where: { id }, // Service ensures ownership
            data,
            include: this.defaultInclude,
        });
    }

    async upsert(
        userId: string,
        periodId: string,
        ratioId: string,
        updateData: Pick<EvaluationResult, 'value' | 'status' | 'calculatedAt'>,
        createData: Omit<EvaluationResult, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'ratio' | 'period' | 'user'>
    ): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.upsert({
            where: {
                uniq_result_ratio_period: {
                    ratioId: ratioId,
                    periodId: periodId,
                },
                // It's important the unique constraint effectively scopes by user if userId isn't part of it.
                // Since uniq_result_ratio_period does not include userId, we must trust that
                // periodId itself is unique to a user or that the service layer correctly uses `findExisting` with userId.
                // For safety, if the service layer calls this, it should have already confirmed ownership of the period.
            },
            update: updateData,
            create: createData,
            include: this.defaultInclude,
        });
    }


    async softDelete(id: string): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: this.defaultInclude,
        });
    }
}