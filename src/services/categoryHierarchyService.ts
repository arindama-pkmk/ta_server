// src/services/categoryHierarchyService.ts
import { AccountType, Category, Subcategory } from '@prisma/client';
import { CategoryHierarchyRepository } from '../repositories/categoryHierarchyRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { NotFoundError } from '../utils/errorHandler';
import prisma from '../config/database';

@injectable()
export class CategoryHierarchyService {
    private readonly repository: CategoryHierarchyRepository;

    constructor(@inject(TYPES.CategoryHierarchyRepository) repository: CategoryHierarchyRepository) {
        this.repository = repository;
    }

    async getAllAccountTypes(): Promise<AccountType[]> {
        return this.repository.findAllAccountTypes();
    }

    async getCategoriesByAccountType(accountTypeId: string): Promise<Category[]> {
        // Optional: Check if AccountType exists
        const accountType = await prisma.accountType.findUnique({ where: { id: accountTypeId, deletedAt: null } });
        if (!accountType) throw new NotFoundError(`AccountType with ID ${accountTypeId} not found.`);
        return this.repository.findCategoriesByAccountTypeId(accountTypeId);
    }

    async getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
        // Optional: Check if Category exists
        const category = await prisma.category.findUnique({ where: { id: categoryId, deletedAt: null } });
        if (!category) throw new NotFoundError(`Category with ID ${categoryId} not found.`);
        return this.repository.findSubcategoriesByCategoryId(categoryId);
    }
}