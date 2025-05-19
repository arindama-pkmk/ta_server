// src/services/transactionService.ts
import { Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import {
    TransactionRepository,
    CreateTransactionDto,
    UpdateTransactionDto,
    PopulatedTransaction
} from '../repositories/transactionRepository';
import { TYPES } from '../utils/types';
import { BadRequestError, NotFoundError } from '../utils/errorHandler';
import logger from '../utils/logger';
import prisma from '../config/database'; // For direct prisma client if needed (e.g. specific complex queries)

// DTO for the summary
interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    netSavings: number; // totalIncome - totalExpense
    count: number;
    breakdownByCategory: Array<{
        categoryId: string;
        categoryName: string;
        accountTypeName: string;
        totalAmount: number;
        transactionCount: number;
    }>;
}

@injectable()
export class TransactionService {
    private readonly transactionRepository: TransactionRepository;
    // ClassifierService is no longer injected here as per our decision for client-side classification initiation

    constructor(
        @inject(TYPES.TransactionRepository) transactionRepository: TransactionRepository,
    ) {
        this.transactionRepository = transactionRepository;
    }

    // PSPEC 2.1: Create Transaction
    async createNewTransaction(dto: CreateTransactionDto, userId: string): Promise<PopulatedTransaction> {
        if (!dto.subcategoryId) {
            throw new BadRequestError("Subcategory ID is required to create a transaction.");
        }
        // Validate subcategoryId exists
        const subcategory = await prisma.subcategory.findUnique({ where: { id: dto.subcategoryId } });
        if (!subcategory) {
            throw new BadRequestError(`Subcategory with ID ${dto.subcategoryId} not found.`);
        }
        // Potentially add more business logic here (e.g., if creating transaction affects other entities)
        logger.info(`[TransactionService] Creating transaction for user ${userId}, desc: ${dto.description}`);
        return this.transactionRepository.create(dto, userId);
    }

    // PSPEC 2.2: Get All Transactions for User (with potential filtering)
    // This method provides a flexible way to get transactions, often used by dashboard.
    // Specific filters (date, category, subcategory) will call this or use more specific repo methods.
    async getAllUserTransactions(
        userId: string,
        filters?: {
            startDate?: string;
            endDate?: string;
            categoryId?: string;
            subcategoryId?: string;
            isBookmarked?: boolean;
            // Add other PSPEC 2.6 filter_criteria here
        },
        pagination?: { skip?: number; take?: number; }
    ): Promise<PopulatedTransaction[]> {
        const whereClause: Prisma.TransactionWhereInput = { userId }; // Scoped by user

        if (filters?.startDate) {
            whereClause.date = { ...(typeof whereClause.date === 'object' && whereClause.date !== null ? whereClause.date : {}), gte: new Date(filters.startDate) };
        }
        if (filters?.endDate) {
            whereClause.date = { ...(typeof whereClause.date === 'object' && whereClause.date !== null ? whereClause.date : {}), lte: new Date(filters.endDate) };
        }

        if (filters?.categoryId && filters?.subcategoryId) { // If both, subcategory takes precedence for direct link
            whereClause.subcategoryId = filters.subcategoryId;
        } else if (filters?.subcategoryId) {
            whereClause.subcategoryId = filters.subcategoryId;
        } else if (filters?.categoryId) {
            whereClause.subcategory = { categoryId: filters.categoryId };
        }

        if (typeof filters?.isBookmarked === 'boolean') {
            whereClause.isBookmarked = filters.isBookmarked;
        }

        logger.info(`[TransactionService] Fetching all transactions for user ${userId} with filters: ${JSON.stringify(filters)}`);
        const options: any = {
            where: whereClause,
            orderBy: { date: 'desc' }
        };
        if (typeof pagination?.skip === 'number') {
            options.skip = pagination.skip;
        }
        if (typeof pagination?.take === 'number') {
            options.take = pagination.take;
        }
        return this.transactionRepository.findAllByUserId(userId, options);
    }

    // PSPEC 2.3: View Transaction Detail
    async getTransactionById(transactionId: string, userId: string): Promise<PopulatedTransaction> {
        const transaction = await this.transactionRepository.findById(transactionId);
        if (!transaction || transaction.userId !== userId) {
            throw new NotFoundError(`Transaction with ID ${transactionId} not found or access denied.`);
        }
        return transaction;
    }

    // PSPEC 2.4: Edit Transaction
    async updateExistingTransaction(transactionId: string, dto: UpdateTransactionDto, userId: string): Promise<PopulatedTransaction> {
        const existingTransaction = await this.getTransactionById(transactionId, userId); // Ensures ownership & existence (active)

        if (dto.subcategoryId) {
            const subcategory = await prisma.subcategory.findUnique({ where: { id: dto.subcategoryId } });
            if (!subcategory) {
                throw new BadRequestError(`Subcategory with ID ${dto.subcategoryId} for update not found.`);
            }
        }
        logger.info(`[TransactionService] Updating transaction ${transactionId} for user ${userId}`);
        return this.transactionRepository.update(transactionId, dto);
    }

    // PSPEC 2.5: Delete Transaction (Soft Delete)
    async deleteUserTransaction(transactionId: string, userId: string): Promise<void> {
        const existingTransaction = await this.getTransactionById(transactionId, userId); // Ensures ownership & existence (active)
        logger.info(`[TransactionService] Soft-deleting transaction ${transactionId} for user ${userId}`);
        await this.transactionRepository.softDelete(transactionId);
    }

    async bookmarkTransaction(transactionId: string, userId: string): Promise<PopulatedTransaction> {
        const transaction = await this.getTransactionById(transactionId, userId); // Ensures ownership
        const newBookmarkStatus = !transaction.isBookmarked;
        logger.info(`[TransactionService] Setting bookmark status to ${newBookmarkStatus} for transaction ${transactionId}`);
        return this.transactionRepository.update(transactionId, { isBookmarked: newBookmarkStatus });
    }

    // For getTransactionsByDateRange, getTransactionsByCategory, getTransactionsBySubcategory,
    // these can now use the more generic getAllUserTransactions with appropriate filters.
    async getTransactionsByDateRange(startDateStr: string, endDateStr: string, userId: string): Promise<PopulatedTransaction[]> {
        return this.getAllUserTransactions(userId, { startDate: startDateStr, endDate: endDateStr });
    }

    async getTransactionsByCategoryName(categoryName: string, userId: string): Promise<PopulatedTransaction[]> {
        // This requires finding categoryId by name first, or adapting repository/query
        const category = await prisma.category.findFirst({ where: { name: categoryName, deletedAt: null } });
        if (!category) return [];
        return this.getAllUserTransactions(userId, { categoryId: category.id });
    }

    async getTransactionsBySubcategoryName(subcategoryName: string, userId: string): Promise<PopulatedTransaction[]> {
        // This requires finding subcategoryId by name first
        const subcategory = await prisma.subcategory.findFirst({ where: { name: subcategoryName, deletedAt: null } });
        if (!subcategory) return [];
        return this.getAllUserTransactions(userId, { subcategoryId: subcategory.id });
    }

    // Transaction Summary (PSPEC 2.2 part)
    async getTransactionSummary(userId: string, startDate?: string, endDate?: string): Promise<TransactionSummary> {
        const filters: any = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const transactions = await this.getAllUserTransactions(userId, filters);

        const summary: TransactionSummary = {
            totalIncome: 0,
            totalExpense: 0,
            netSavings: 0,
            count: transactions.length,
            breakdownByCategory: [],
        };

        const categoryMap = new Map<string, { categoryName: string, accountTypeName: string, total: number, count: number }>();

        for (const tx of transactions) {
            // PopulatedTransaction ensures these fields are present
            const catId = tx.subcategory.categoryId;
            const catName = tx.subcategory.category.name;
            const accTypeName = tx.subcategory.category.accountType.name.toLowerCase();

            const catSummary = categoryMap.get(catId) ?? { categoryName: catName, accountTypeName: accTypeName, total: 0, count: 0 };
            catSummary.total += tx.amount;
            catSummary.count += 1;
            categoryMap.set(catId, catSummary);

            if (accTypeName === 'pemasukan') {
                summary.totalIncome += tx.amount;
            } else if (accTypeName === 'pengeluaran') {
                summary.totalExpense += tx.amount;
            }
        }
        summary.netSavings = summary.totalIncome - summary.totalExpense;
        summary.breakdownByCategory = Array.from(categoryMap.entries()).map(([id, data]) => ({
            categoryId: id,
            categoryName: data.categoryName,
            accountTypeName: data.accountTypeName,
            totalAmount: data.total,
            transactionCount: data.count,
        }));

        return summary;
    }
}

export { PopulatedTransaction };
