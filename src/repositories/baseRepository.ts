// repositories/baseRepository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
    protected prisma: PrismaClient;
    protected model: { create: Function; findMany: Function; findUnique: Function; findFirst: Function; update: Function; delete: Function };

    constructor(prisma: PrismaClient, model: {
        create: Function;
        findMany: Function;
        findUnique: Function;
        findFirst: Function;
        update: Function;
        delete: Function;
    }) {
        this.prisma = prisma;
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        return this.model.create({ data });
    }

    async findAll(params?: { where?: any; orderBy?: any; skip?: number; take?: number }): Promise<T[]> {
        return this.model.findMany(params);
    }

    async findById(id: string): Promise<T | null> {
        return this.model.findUnique({ where: { id } });
    }

    async findFirst(query: object): Promise<T | null> {
        return this.model.findFirst(query);
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        return this.model.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.model.delete({ where: { id } });
    }
}
