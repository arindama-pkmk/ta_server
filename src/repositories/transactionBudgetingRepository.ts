import { PrismaClient, Allocation } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class TransactionBudgetingRepository extends BaseRepository<Allocation> {
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.allocation);
    }

    // Override to automatically include related transaction and template
    override async findAll(params?: {
        where?: any;
        orderBy?: any;
        skip?: number;
        take?: number;
    }): Promise<Allocation[]> {
        return this.prisma.allocation.findMany({
            ...params,
            include: {
                transaction: true,
                template: true,
            },
        });
    }

    // Override to include relations on single fetch
    override async findById(id: string): Promise<Allocation | null> {
        return this.prisma.allocation.findUnique({
            where: { id },
            include: {
                transaction: true,
                template: true,
            },
        });
    }
}
