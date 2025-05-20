// src/repositories/categoryHierarchyRepository.ts
import { PrismaClient, AccountType, Category, Subcategory } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class CategoryHierarchyRepository {
    private readonly prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async findAllAccountTypes(): Promise<AccountType[]> {
        return this.prisma.accountType.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' },
        });
    }

    async findCategoriesByAccountTypeId(accountTypeId: string): Promise<Category[]> {
        return this.prisma.category.findMany({
            where: { accountTypeId: accountTypeId, deletedAt: null },
            orderBy: { name: 'asc' },
        });
    }

    async findSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
        return this.prisma.subcategory.findMany({
            where: { categoryId: categoryId, deletedAt: null },
            orderBy: { name: 'asc' },
        });
    }
}