// src/controllers/transactionController.ts
import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TransactionService } from '../services/transactionService';
import { TYPES } from '../utils/types';
import { AuthRequest } from '../types/auth';
import { CreateTransactionDto, UpdateTransactionDto } from '../repositories/transactionRepository';
import { BadRequestError, UnauthorizedError } from '../utils/errorHandler';

@injectable()
export class TransactionController {
  private readonly transactionService: TransactionService;

  constructor(@inject(TYPES.TransactionService) transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  // POST /transactions - Create Transaction (PSPEC 2.1)
  async createTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      // Zod validation (createTransactionSchema) handled by middleware
      const dto = req.body as CreateTransactionDto; // Client sends subcategoryId
      const newTransaction = await this.transactionService.createNewTransaction(dto, req.user.id);
      res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
      next(error);
    }
  }

  // GET /transactions - Get All User Transactions (PSPEC 2.2, 2.6)
  async getAllTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');

      // Extract filters from req.query as per DFD/PSPEC 2.6
      const { startDate, endDate, categoryId, subcategoryId, isBookmarked, page, limit } = req.query;
      const filters: {
        startDate?: string;
        endDate?: string;
        categoryId?: string;
        subcategoryId?: string;
        isBookmarked?: boolean;
      } = {};
      if (typeof startDate === 'string') filters.startDate = startDate;
      if (typeof endDate === 'string') filters.endDate = endDate;
      if (typeof categoryId === 'string') filters.categoryId = categoryId;
      if (typeof subcategoryId === 'string') filters.subcategoryId = subcategoryId;
      if (typeof isBookmarked === 'string') filters.isBookmarked = isBookmarked === 'true';

      // TODO: Consider adding pagination metadata to response (total count, total pages)
      const pagination: { skip?: number; take?: number } = {};
      if (page && limit) {
        pagination.skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      }
      if (limit) {
        pagination.take = parseInt(limit as string);
      }

      const transactions = await this.transactionService.getAllUserTransactions(req.user.id, filters, pagination);
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  // GET /transactions/:id - View Transaction Detail (PSPEC 2.3)
  async getTransactionById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { id: transactionId } = req.params;
      if (!transactionId) throw new BadRequestError('Transaction ID parameter is required.');
      const transaction = await this.transactionService.getTransactionById(transactionId, req.user.id);
      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  // PUT /transactions/:id - Edit Transaction (PSPEC 2.4)
  async updateTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { id: transactionId } = req.params;
      if (!transactionId) throw new BadRequestError('Transaction ID parameter is required.');
      // Zod validation (updateTransactionSchema) handled by middleware
      const dto = req.body as UpdateTransactionDto;
      const updatedTransaction = await this.transactionService.updateExistingTransaction(transactionId, dto, req.user.id);
      res.status(200).json({ success: true, data: updatedTransaction });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /transactions/:id - Delete Transaction (PSPEC 2.5)
  async deleteTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { id: transactionId } = req.params;
      if (!transactionId) throw new BadRequestError('Transaction ID parameter is required.');
      await this.transactionService.deleteUserTransaction(transactionId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // POST /transactions/:id/bookmark
  async bookmarkTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { id: transactionId } = req.params;
      if (!transactionId) throw new BadRequestError('Transaction ID parameter is required.');
      const updatedTransaction = await this.transactionService.bookmarkTransaction(transactionId, req.user.id);
      res.status(200).json({ success: true, data: updatedTransaction });
    } catch (error) {
      next(error);
    }
  }

  // GET /transactions/summary
  async getTransactionSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { startDate, endDate } = req.query;
      const summary = await this.transactionService.getTransactionSummary(req.user.id, startDate as string | undefined, endDate as string | undefined);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  // Specific getters (could be part of getAllTransactions with query params)
  async getTransactionsByDateRange(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) throw new UnauthorizedError('Authentication required.');
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) throw new BadRequestError('startDate and endDate query parameters are required.');

      const transactions = await this.transactionService.getTransactionsByDateRange(startDate as string, endDate as string, req.user.id);
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }
  // getTransactionsByCategory and getTransactionsBySubcategory would ideally use IDs from params
  // and then call the service. If they use names, the service handles lookup.
}