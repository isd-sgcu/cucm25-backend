import { AppError } from '@/types/error/AppError';
import { TransactionUsecase } from '@/usecase/transaction/transactionUsecase';
import { logger } from '@/utils/logger';
import type { Request, Response } from 'express';

export class TransactionController {
  private transactionUsecase: TransactionUsecase;

  constructor(transactionUsecase: TransactionUsecase) {
    this.transactionUsecase = transactionUsecase;
  }

  async getUserCoinTransactions(_req: Request, res: Response): Promise<void> {
    try {
      const user = _req.user;

      const result: {
        statusCode: number;
        message?: string;
        data?: object;
      } = await this.transactionUsecase.getCoinTransactions(user);

      res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      logger.error(
        'transactionController',
        'Error getting coin history:',
        error,
      );
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }

  async getUserGiftTransactions(_req: Request, res: Response): Promise<void> {
    try {
      const user = _req.user;

      const result: {
        statusCode: number;
        message?: string;
        data?: object;
      } = await this.transactionUsecase.getGiftTransactions(user);

      res.status(result.statusCode).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      logger.error(
        'transactionController',
        'Error getting coin history:',
        error,
      );
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }
}
