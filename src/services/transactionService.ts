// src/services/transactionService.ts
import { Prisma, Transaction } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TransactionRepository } from '../repositories/transactionRepository';
import { TYPES } from '../utils/types';
import { BaseService } from './baseService';

interface TransactionSummary {
    totalAmount: number;
    totalByCategory: { [categoryName: string]: number };
    netTotal: number; // income - expense
}

@injectable()
export class TransactionService extends BaseService<Transaction> {
    constructor(@inject(TYPES.TransactionRepository) transactionRepository: TransactionRepository) {
        super(transactionRepository);
    }

    async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        return this.repository.findAll({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });
    }

    async getTransactionsByCategory(category: string): Promise<Transaction[]> {
        return this.repository.findAll({
            where: {
                category: category,
            },
        });
    }

    getTransactionsBySubcategory(subcategory: string): Promise<Transaction[]> {
        return this.repository.findAll({
            where: {
                subcategory: subcategory,
            },
        });
    }

    async getTransactionSummary(): Promise<TransactionSummary> {
        const transactions = await this.repository.findAll<
            Prisma.TransactionFindManyArgs,
            Prisma.TransactionGetPayload<{ include: { category: true } }>
        >({ include: { category: true } });

        const summary: TransactionSummary = {
            totalAmount: 0,
            totalByCategory: {},
            netTotal: 0,
        };

        for (const tx of transactions) {
            const categoryName = tx.category?.categoryName || 'Uncategorized';
            const accountType = tx.category?.accountType?.toLowerCase();

            summary.totalAmount += tx.amount;
            summary.totalByCategory[categoryName] = (summary.totalByCategory[categoryName] || 0) + tx.amount;

            if (accountType === 'income' || accountType === 'pemasukan') {
                summary.netTotal += tx.amount;
            } else if (accountType === 'expense' || accountType === 'pengeluaran') {
                summary.netTotal -= tx.amount;
            }
        }

        return summary;
    }

    async bookmarkTransaction(id: string): Promise<Transaction> {
        const transaction = await this.repository.findById(id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return this.repository.update(id, {
            isBookmarked: !transaction.isBookmarked,
        });
    }
}
