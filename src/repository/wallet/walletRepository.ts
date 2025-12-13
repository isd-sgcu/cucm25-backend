import { prisma } from '@/lib/prisma';
import { AppError } from '@/types/error/AppError';
import { TransactionType } from '@prisma/client';

export class WalletRepository {
  constructor() {}

  async getUserWallet(userId: string) {
    return await prisma.wallet.findUnique({
      where: { user_id: userId },
    });
  }

  async deductCoins(
    userId: string,
    amount: number,
    transactionType: 'PAYMENT' | 'TICKET_PURCHASE' | 'ADMIN_ADJUSTMENT' = 'PAYMENT',
  ) {
    const userWallet = await this.getUserWallet(userId);
    if (!userWallet || userWallet.coin_balance < amount) {
      throw new AppError('Insufficient coin balance', 400);
    }

    const [wallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { user_id: userId },
        data: {
          coin_balance: {
            decrement: amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          sender_user_id: userId,
          coin_amount: amount,
          type: transactionType,
        },
      }),
    ]);

    return wallet;
  }

  async addCoins(
    userId: string,
    amount: number,
    transactionType: 'CODE_REDEMPTION' | 'GIFT' | 'ADMIN_ADJUSTMENT',
  ) {
    return await prisma.$transaction([
      prisma.wallet.update({
        where: { user_id: userId },
        data: {
          coin_balance: {
            increment: amount,
          },
          cumulative_coin: {
            increment: amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          recipient_user_id: userId,
          coin_amount: amount,
          type: transactionType,
        },
      }),
    ]
    );
  }
}
