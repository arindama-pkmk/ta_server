// services/transactionService.ts
import { Transaction } from '@prisma/client';
import { BaseService } from './baseService';
import { TransactionRepository } from '../repositories/transactionRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    netTotal: number;
}

@injectable()
export class TransactionService extends BaseService<Transaction> {
    constructor(@inject(TYPES.TransactionRepository) transactionRepository: TransactionRepository) {
        super(transactionRepository);
    }

    /**
     * Retrieves transactions between the given startDate and endDate.
     *
     * @param startDate - The start date in ISO format.
     * @param endDate - The end date in ISO format.
     * @returns A promise that resolves with an array of transactions.
     */
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

    /**
     * Retrieves transactions by category.
     *
     * @param category - The category to filter transactions by.
     * @returns A promise that resolves with an array of transactions in that category.
     */
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

    /**
     * Retrieves a summary of transactions: total income, total expense, and net total.
     *
     * @returns A promise that resolves with the transaction summary.
     */
    async getTransactionSummary(): Promise<TransactionSummary> {
        const transactions = await this.repository.findAll();
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach((tx) => {
            // Assuming your Transaction model has a "type" field that is a string ('income' or 'expense')
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else if (tx.type === 'expense') {
                totalExpense += tx.amount;
            }
        });
        return {
            totalIncome,
            totalExpense,
            netTotal: totalIncome - totalExpense,
        };
    }
}
