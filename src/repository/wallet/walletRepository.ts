import { prisma } from "@/lib/prisma";

export class WalletRepository {
  constructor() {}

  async getUserWallet(userId: string) {
    return await prisma.wallet.findUnique({
      where: { user_id: userId }
    });
  }

  async deductCoins(userId: string, amount: number) {
    const userWallet = await this.getUserWallet(userId);
    if (!userWallet || userWallet.coin_balance < amount) {
      throw new Error("Insufficient coin balance");
    }
    
    const wallet = await prisma.wallet.update({
      where: { user_id: userId },
      data: {
        coin_balance: {
          decrement: amount
        }
      }
    });

    if (wallet) {
      await prisma.transaction.create({
        data: {
          sender_user_id: userId,
          coin_amount: amount,
          type: "SPEND",
        }
      })
    }

    return wallet;
  }

  async addCoins(userId: string, amount: number) {
    return await prisma.wallet.update({
      where: { user_id: userId },
      data: {
        coin_balance: {
          increment: amount
        },
        cumulative_coin: {
          increment: amount
        }
      }
    });
  }
}