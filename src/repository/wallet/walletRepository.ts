import { prisma } from "@/lib/prisma";

export class WalletRepository {
  constructor() {}

  async getUserWallet(userId: string) {

    return await prisma.wallet.findUnique({
      where: { user_id: userId }
    });
  }

  async deductCoins(userId: string, amount: number) {
    return await prisma.wallet.update({
      where: { user_id: userId },
      data: {
        coin_balance: {
          decrement: amount
        }
      }
    });
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