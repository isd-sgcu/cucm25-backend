import { prisma } from '@/lib/prisma';
import { AppError } from '@/types/error/AppError';
import { ParsedUser } from '@/types/user';

export class TransactionRepository {
  // 1 exp is 1 current_level = 1 coin (they're the same)
  async create(
    sender: ParsedUser | null,
    recipient: ParsedUser | null,
    amount: number,
  ): Promise<void> {
    // to be fair this shouldn't even go in the branch
    // but its here so that the typescript compiler doesn't complain
    if (!sender || !recipient) {
      throw new AppError('Missing data on transaction record.', 500);
    }

    await prisma.transaction.create({
      data: {
        sender_user_id: sender.id,
        recipient_user_id: recipient.id,
        type: 'GIFT',
        coin_amount: amount,
      },
    });
  }

  async getUserCoinTransactions(user: ParsedUser | null) {
    if (!user) {
      throw new AppError('Missing user info', 500);
    }

    // get either...
    // - if `user` is the recipient OR
    // - if `user` is the sender *and* it's not a gift.
    const result = await prisma.transaction.findMany({
      where: {
        OR: [
          { recipient_user_id: user.id },
          {
            AND: [{ sender_user_id: user.id }, { type: { not: 'GIFT' } }],
          },
        ],
      },
    });

    return result;
  }

  async getUserGiftTransactions(user: ParsedUser | null) {
    if (!user) {
      throw new AppError('Missing user info', 500);
    }

    // get...
    // - if `user` is the sender *and* it's a gift.
    const result = await prisma.transaction.findMany({
      where: {
        AND: [{ sender_user_id: user.id }, { type: 'GIFT' }],
      },
    });

    return result;
  }
}
