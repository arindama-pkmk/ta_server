// controllers/transactionController.ts
import { Transaction } from '@prisma/client';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TransactionService } from '../services/transactionService';
import { TYPES } from '../utils/types';
import { BaseController } from './baseController';

@injectable()
export class TransactionController extends BaseController<Transaction> {
  constructor(@inject(TYPES.TransactionService) transactionService: TransactionService) {
    super(transactionService);
  }

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

  async getTransactionSummary(_req: Request, res: Response): Promise<void> {
    try {
      const transactionService = this.service as TransactionService;
      const summary = await transactionService.getTransactionSummary();
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  async bookmarkTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'ID parameter is required' });
        return;
      }
      const transactionService = this.service as TransactionService;
      const updatedTransaction = await transactionService.bookmarkTransaction(id);
      res.status(200).json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}
