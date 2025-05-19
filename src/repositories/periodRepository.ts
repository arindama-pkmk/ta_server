// src/repositories/periodRepository.ts
import { PrismaClient, Period, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
// No BaseRepository import needed

// DTO for Period Creation
export type CreatePeriodDto = Omit<Period, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId'>;
// DTO for Period Update (most fields optional)
export type UpdatePeriodDto = Partial<Omit<Period, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'userId'>>;


@injectable()
export class PeriodRepository {
    private readonly prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: CreatePeriodDto, userId: string): Promise<Period> {
        return this.prisma.period.create({
            data: {
                ...data,
                userId: userId,
            },
        });
    }

    async findById(id: string): Promise<Period | null> {
        return this.prisma.period.findFirst({
            where: {
                id,
                deletedAt: null, // Exclude soft-deleted
            },
        });
    }

    async findByIdAndUserId(id: string, userId: string): Promise<Period | null> {
        return this.prisma.period.findFirst({
            where: {
                id,
                userId,
                deletedAt: null,
            },
        });
    }

    async findByUserAndType(
        userId: string,
        periodType?: string,
        args?: Omit<Prisma.PeriodFindManyArgs, 'where'> // Allow other args like orderBy, include
    ): Promise<Period[]> {
        const whereClause: Prisma.PeriodWhereInput = {
            userId,
            deletedAt: null, // Exclude soft-deleted
        };
        if (periodType) {
            whereClause.periodType = periodType;
        }
        return this.prisma.period.findMany({
            ...args,
            where: whereClause,
            orderBy: args?.orderBy || { startDate: 'desc' }, // Default ordering
        });
    }

    async findExisting(userId: string, startDate: Date, endDate: Date, periodType: string): Promise<Period | null> {
        return this.prisma.period.findFirst({
            where: {
                userId,
                startDate,
                endDate,
                periodType,
                deletedAt: null,
            }
        });
    }

    async update(id: string, data: UpdatePeriodDto): Promise<Period> {
        // Ownership check should happen in service before calling this
        return this.prisma.period.update({
            where: { id /*, deletedAt: null - an update implies it's not deleted, or service found it */ },
            data,
        });
    }

    // Soft delete
    async softDelete(id: string): Promise<Period> {
        // Ownership check in service
        return this.prisma.period.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Hard delete (use with caution)
    async hardDelete(id: string): Promise<Period> {
        return this.prisma.period.delete({
            where: { id },
        });
    }

    // Restore
    async restore(id: string): Promise<Period> {
        return this.prisma.period.update({
            where: { id },
            data: { deletedAt: null },
        });
    }
}