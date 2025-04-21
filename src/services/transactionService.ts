// src/services/transactionService.ts
import { Transaction, TransactionType } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TransactionRepository } from '../repositories/transactionRepository';
import { TYPES } from '../utils/types';
import { BaseService } from './baseService';

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
        const transactions = await this.repository.findAll();
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach((tx) => {
            // Assuming your Transaction model has a "type" field that is a string ('income' or 'expense')
            if (tx.type.toLowerCase() === TransactionType.INCOME.toLowerCase()) {
                totalIncome += tx.amount;
            } else if (tx.type.toLowerCase() === TransactionType.EXPENSE.toLowerCase()) {
                totalExpense += tx.amount;
            }
        });
        return {
            totalIncome,
            totalExpense,
            netTotal: totalIncome - totalExpense,
        };
    }

    async bookmarkTransaction(id: string): Promise<Transaction> {
        const transaction = await this.repository.findById(id);
        if (!transaction) throw new Error('Transaction not found');

        return this.repository.update(id, {
            isBookmarked: !transaction.isBookmarked,
        });
    }
}
