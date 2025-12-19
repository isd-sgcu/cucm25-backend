import { prisma } from '@/lib/prisma';
import { AppError } from '@/types/error/AppError';

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
    transactionType:
      | 'PAYMENT'
      | 'TICKET_PURCHASE'
      | 'ADMIN_ADJUSTMENT' = 'PAYMENT',
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
          coin_amount: -amount,
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
    options?: {
      codeId?: number;
      senderId?: string;
    },
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
          related_code_id:
            transactionType === 'CODE_REDEMPTION' &&
            options?.codeId !== undefined
              ? options.codeId
              : null,
          sender_user_id:
            transactionType === 'GIFT' && options?.senderId
              ? options.senderId
              : userId,
        },
      }),
    ]);
  }

  async bulkAddCoins(
    adjustments: { userId: string; amount: number }[],
    transactionType: 'ADMIN_ADJUSTMENT',
    adjustCumulative: boolean = true,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const adjustment of adjustments) {
        await tx.wallet.update({
          where: { user_id: adjustment.userId },
          data: {
            coin_balance: {
              increment: adjustment.amount,
            },
            ...(adjustCumulative
              ? {
                  cumulative_coin: {
                    increment: adjustment.amount,
                  },
                }
              : {}),
          },
        });
        await tx.transaction.create({
          data: {
            recipient_user_id: adjustment.userId,
            coin_amount: adjustment.amount,
            type: transactionType,
          },
        });
      }
    });
  }
}
