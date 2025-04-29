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
    override async findAll<
        Args = Record<string, unknown>,
        Result = Allocation
    >(args?: Args): Promise<Result[]> {
        return this.prisma.allocation.findMany({
            ...args,
            include: {
                transaction: true,
                template: true,
            },
        }) as Promise<Result[]>;
    }

    // Override to include relations on single fetch
    override async findById<Args = Record<string, unknown>, Result = Allocation>(
        id: string,
        args?: Args
    ): Promise<Result | null> {
        return this.prisma.allocation.findUnique({
            where: { id },
            ...args,
            include: {
                transaction: true,
                template: true,
            },
        }) as Promise<Result | null>;
    }
}
