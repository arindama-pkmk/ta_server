// src/controllers/categoryHierarchyController.ts
import { Request, Response, NextFunction } from 'express';
import { CategoryHierarchyService } from '../services/categoryHierarchyService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { BadRequestError } from '../utils/errorHandler';

@injectable()
export class CategoryHierarchyController {
    private readonly service: CategoryHierarchyService;

    constructor(@inject(TYPES.CategoryHierarchyService) service: CategoryHierarchyService) {
        this.service = service;
    }

    async getAllAccountTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const accountTypes = await this.service.getAllAccountTypes();
            res.status(200).json({ success: true, data: accountTypes });
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { accountTypeId } = req.query;
            if (!accountTypeId || typeof accountTypeId !== 'string') {
                throw new BadRequestError('accountTypeId query parameter is required.');
            }
            const categories = await this.service.getCategoriesByAccountType(accountTypeId);
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    async getSubcategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { categoryId } = req.query;
            if (!categoryId || typeof categoryId !== 'string') {
                throw new BadRequestError('categoryId query parameter is required.');
            }
            const subcategories = await this.service.getSubcategoriesByCategory(categoryId);
            res.status(200).json({ success: true, data: subcategories });
        } catch (error) {
            next(error);
        }
    }
}