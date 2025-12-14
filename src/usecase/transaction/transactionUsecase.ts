import { TransactionRepository } from '@/repository/transaction/transactionRepository';
import { AuthUser } from '@/types/auth';
import { AppError } from '@/types/error/AppError';
import { CoinHistoryRecord, GiftHistoryRecord } from '@/types/transaction';

export class TransactionUsecase {
  private transactionRepository: TransactionRepository;

  constructor(transactionRepository: TransactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  async getCoinTransactions(user: AuthUser | undefined): Promise<{
    statusCode: number;
    message?: string;
    data?: Array<CoinHistoryRecord>;
  }> {
    try {
      const result =
        await this.transactionRepository.getUserCoinTransactions(user);
      return {
        statusCode: 200,
        data: result,
      };
    } catch (error) {
      throw new AppError('Unable to get coin transactions', 500);
    }
  }

  async getGiftTransactions(user: AuthUser | undefined): Promise<{
    statusCode: number;
    message?: string;
    data?: Array<GiftHistoryRecord>;
  }> {
    try {
      const result =
        await this.transactionRepository.getUserGiftTransactions(user);
      return {
        statusCode: 200,
        data: result,
      };
    } catch (error) {
      throw new AppError('Unable to get gift transactions', 500);
    }
  }
}
