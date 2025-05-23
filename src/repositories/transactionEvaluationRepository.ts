// src/repositories/transactionEvaluationRepository.ts
import { PrismaClient, EvaluationResult, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

export type CreateEvaluationResultDto = Omit<EvaluationResult, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'ratio' | 'user'>;
// Note: userId, startDate, endDate, ratioId, value, status, calculatedAt are expected in the DTO

export type UpdateEvaluationResultDto = Partial<Pick<EvaluationResult, 'value' | 'status' | 'calculatedAt'>>;

const evaluationResultIncludeDefault = {
    ratio: true, // Include details of the Ratio being evaluated
    // user: false, // Usually not needed for a list of results
} satisfies Prisma.EvaluationResultInclude;

export type PopulatedEvaluationResult = Prisma.EvaluationResultGetPayload<{
    include: typeof evaluationResultIncludeDefault
}>;

// Define the type for the arguments more precisely
type FindAllArgs = Omit<Prisma.EvaluationResultFindManyArgs, 'where' | 'include'> & {
    where?: Prisma.EvaluationResultWhereInput; // Prisma's where type
    // These are for custom filtering logic, not direct Prisma args
    customStartDate?: Date;
    customEndDate?: Date;
};


@injectable()
export class TransactionEvaluationRepository {
    private readonly prisma: PrismaClient;
    private readonly defaultInclude = evaluationResultIncludeDefault;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: CreateEvaluationResultDto): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.create({
            data: {
                userId: data.userId,
                startDate: data.startDate,
                endDate: data.endDate,
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
            where: { id, deletedAt: null },
            include: this.defaultInclude,
        });
    }

    async findExisting(userId: string, startDate: Date, endDate: Date, ratioId: string): Promise<PopulatedEvaluationResult | null> {
        return this.prisma.evaluationResult.findFirst({
            where: {
                userId,
                startDate,
                endDate,
                ratioId,
                deletedAt: null,
            },
            include: this.defaultInclude // Added include
        });
    }

    async findAllByUserIdAndOptionalDateRange(
        userId: string,
        args?: FindAllArgs // Use the more precise FindAllArgs
    ): Promise<PopulatedEvaluationResult[]> {
        // Separate Prisma-compatible args from custom filter args
        const { customStartDate, customEndDate, where: argsWhere, ...prismaCompatibleArgs } = args ?? {};

        const whereClause: Prisma.EvaluationResultWhereInput = {
            userId,
            deletedAt: null,
            ...(argsWhere || {}), // Spread where from input args
        };

        if (customStartDate) {
            whereClause.startDate = { ...(whereClause.startDate as Prisma.DateTimeFilter || {}), gte: customStartDate };
        }
        if (customEndDate) {
            whereClause.endDate = { ...(whereClause.endDate as Prisma.DateTimeFilter || {}), lte: customEndDate };
        }
        // If you need to find results FOR a specific range (exact match on startDate and endDate in whereClause):
        // if (customStartDate) whereClause.startDate = customStartDate;
        // if (customEndDate) whereClause.endDate = customEndDate;


        return this.prisma.evaluationResult.findMany({
            ...prismaCompatibleArgs, // Spread orderBy, skip, take etc. from prismaCompatibleArgs
            where: whereClause,
            include: this.defaultInclude,
            orderBy: args?.orderBy || { calculatedAt: 'desc' }, // Still access original args for orderBy
        });
    }

    async update(id: string, data: UpdateEvaluationResultDto): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.update({
            where: { id },
            data,
            include: this.defaultInclude,
        });
    }

    async upsert(
        userId: string,
        startDate: Date,
        endDate: Date,
        ratioId: string,
        updateData: Pick<EvaluationResult, 'value' | 'status' | 'calculatedAt'>,
        // Ensure createDataForUpsert has all necessary fields for EvaluationResult excluding those set by Prisma or relations
        createDataForUpsert: {
            value: number;
            status: EvaluationResult['status']; // Use Prisma's enum type
            calculatedAt?: Date;
        }
    ): Promise<PopulatedEvaluationResult> {
        return this.prisma.evaluationResult.upsert({
            where: {
                uniq_user_eval_result_dates: {
                    userId,
                    ratioId,
                    startDate,
                    endDate,
                },
            },
            update: updateData,
            create: {
                userId,
                startDate,
                endDate,
                ratioId,
                value: createDataForUpsert.value,
                status: createDataForUpsert.status,
                calculatedAt: createDataForUpsert.calculatedAt || new Date(),
            },
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