import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/types/auth';
import { AppError } from '@/types/error/AppError';
import { CoinHistoryRecord, GiftHistoryRecord } from '@/types/transaction';
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

  async getUserCoinTransactions(user: AuthUser | ParsedUser | undefined) {
    if (!user) {
      throw new AppError('Missing user info', 500);
    }

    // get either...
    // - if `user` is the recipient OR
    // - if `user` is the sender *and* it's not a gift.
    const data = await prisma.transaction.findMany({
      where: {
        OR: [
          { recipient_user_id: user.id },
          {
            AND: [{ sender_user_id: user.id }, { type: { not: 'GIFT' } }],
          },
        ],
      },
      include: { sender: true, recipient: true, relatedCode: true },
    });

    const result: Array<CoinHistoryRecord> = [];

    for (const record of data) {
      let correspondentName = '';
      let action = '';

      if (record.type === 'ADMIN_ADJUSTMENT') {
        correspondentName = `Adjusted by administrator.`;
      } else if (record.type === 'CODE_REDEMPTION') {
        correspondentName = `Redeemed from ${record.relatedCode?.activity_name}`;
        action = 'received';
      } else if (record.type === 'PAYMENT') {
        correspondentName = `Paid to central account.`;
        action = 'sent';
      } else if (record.type === 'TICKET_PURCHASE') {
        correspondentName = `Bought some lucky tickets.`;
        action = 'sent';
      } else if (record.recipient_user_id === user.id) {
        correspondentName = `Received gift from ${record.sender?.firstname} ${record.sender?.lastname}`;
        action = 'received';
      } else {
        correspondentName = `A mystery.`;
        action = record.coin_amount < 0 ? 'sent' : 'received';
      }

      result.push({
        correspondentName: correspondentName,
        amount: record.coin_amount,
        timestamp: record.created_at || new Date(0),
        action: action,
      });
    }

    return result;
  }

  async getUserGiftTransactions(user: AuthUser | ParsedUser | undefined) {
    if (!user) {
      throw new AppError('Missing user info', 500);
    }

    // get...
    // - if `user` is the sender *and* it's a gift.
    const data = await prisma.transaction.findMany({
      where: {
        AND: [{ sender_user_id: user.id }, { type: 'GIFT' }],
      },
      include: { recipient: true },
      orderBy: [
        {
          created_at: 'desc',
        },
      ],
    });

    const result: Array<GiftHistoryRecord> = [];

    for (const record of data) {
      const recipientName = `Sent gift to ${record.recipient?.firstname} ${record.recipient?.lastname}`;
      result.push({
        recipientName: recipientName,
        amount: 1,
        timestamp: record.created_at || new Date(0),
      });
    }

    return result;
  }
}
