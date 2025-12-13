import { GIFT_SYSTEM, SYSTEM_DEFAULTS } from "@/constant/systemConfig";
import { WalletRepository } from "../wallet/walletRepository";
import { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class GiftRepository {
  private walletRepository: WalletRepository;

  constructor(walletRepository?: WalletRepository) {
    this.walletRepository = walletRepository || new WalletRepository();
  }

  async getHourlyQuota(): Promise<number> {
    const giftHourlyQuota = await prisma.systemSetting.findUnique({
      where: { setting_key: "gift_hourly_quota" },
    });

    return parseInt(
      giftHourlyQuota?.setting_value ||
        SYSTEM_DEFAULTS.GIFT_QUOTA.toString()
    );
  }

  async checkRecipientEligibility(senderId: string, recipientId: string): Promise<boolean> {
    const transaction = await prisma.transaction.findFirst({
      where: {
        sender_user_id: senderId,
        recipient_user_id: recipientId,
        type: "GIFT",
      },
    });

    return !transaction;
  }

  async sendGift(senderId: string, recipientId: string): Promise<void> {

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { user_id: senderId },
        data: {
          gift_sends: {
            increment: 1,
          },
        },
      });

      await this.walletRepository.addCoins(
        recipientId,
        GIFT_SYSTEM.DEFAULT_VALUE,
        "GIFT",
        { senderId }
      );
    });
  }
    
}
