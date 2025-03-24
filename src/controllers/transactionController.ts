// controllers/transactionController.ts
import { Request, Response } from 'express';
import { Transaction } from '@prisma/client';
import { BaseController } from './baseController';
import { TransactionService } from '../services/transactionService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class TransactionController extends BaseController<Transaction> {
  /**
   * Initializes a new instance of the TransactionController class with the specified TransactionService.
   * @param {TransactionService} transactionService - The TransactionService that will be used for database operations.
   */
  constructor(@inject(TYPES.TransactionService) transactionService: TransactionService) {
    super(transactionService);
  }

  /**
   * GET /transactions/date-range?startDate=...&endDate=...
   *
   * Retrieves transactions within a specified date range.
   *
   * Expects query parameters `startDate` and `endDate` in ISO format.
   */
  async getTransactionsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'startDate and endDate query parameters are required.' });
        return;
      }
      const transactionService = this.service as TransactionService;
      const transactions = await transactionService.getTransactionsByDateRange(
        startDate as string,
        endDate as string
      );
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /transactions/category/:category
   *
   * Retrieves transactions filtered by a given category.
   */
  async getTransactionsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = req.params['category'];
      if (!category) {
        res.status(400).json({ message: 'Category parameter is required.' });
        return;
      }
      const transactionService = this.service as TransactionService;
      const transactions = await transactionService.getTransactionsByCategory(category);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
 * GET /transactions/subcategory/:subcategory
 *
 * Retrieves transactions filtered by a given subcategory.
 */
  async getTransactionsBySubcategory(req: Request, res: Response): Promise<void> {
    try {
      const subcategory = req.params['subcategory'];
      if (!subcategory) {
        res.status(400).json({ message: 'Subcategory parameters are required.' });
        return;
      }
      const transactionService = this.service as TransactionService;
      const transactions = await transactionService.getTransactionsBySubcategory(subcategory);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /transactions/summary
   *
   * Retrieves a summary of transactions (e.g., total income, total expense, net amount).
   */
  async getTransactionSummary(_req: Request, res: Response): Promise<void> {
    try {
      const transactionService = this.service as TransactionService;
      const summary = await transactionService.getTransactionSummary();
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

