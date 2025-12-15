import {
  CodeRedemption,
  Transaction,
  Wallet,
  Code,
} from '@prisma/client';
import { AppError } from '@/types/error/AppError';
import { prisma } from '@/lib/prisma';
import { WalletRepository } from '@/repository/wallet';

export class CodeRepository {
  private WalletRepository: WalletRepository;

  constructor(walletRepository?: WalletRepository) {
    this.WalletRepository = walletRepository || new WalletRepository();
  }

  async createCode(data: {
    codeString: string;
    targetRole: string;
    activityName: string;
    rewardCoin: number;
    createdByUserId: string;
    expiresAt: Date;
  }): Promise<Code> {
    const createData = {
      code_string: data.codeString,
      target_role: data.targetRole,
      activity_name: data.activityName,
      reward_coin: data.rewardCoin,
      expires_at: data.expiresAt,
      created_by_user_id: data.createdByUserId,
    };

    return await prisma.code.create({
      data: createData,
    });
  }

  async findCodeByString(codeString: string): Promise<Code | null> {
    return await prisma.code.findUnique({
      where: { code_string: codeString },
    });
  }

  async redeemCode(
    userId: string,
    code: Code,
  ): Promise<[CodeRedemption, Transaction, Wallet]> {
    const existingRedemption = await prisma.codeRedemption.findUnique({
      where: {
        user_id_code_id: {
          user_id: userId,
          code_id: code.id,
        },
      },
    });

    if (existingRedemption) {
      throw new AppError('You have already redeemed this code', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const redemption = await tx.codeRedemption.create({
        data: {
          user_id: userId,
          code_id: code.id,
        },
      });

      const [wallet, transaction] = await this.WalletRepository.addCoins(
        userId,
        code.reward_coin,
        'CODE_REDEMPTION',
        { codeId: code.id },
      );

      return [redemption, transaction, wallet];
    });
  }

  async getSelfCreatedCodes(userId: string): Promise<Code[]> {
    return await prisma.code.findMany({
      where: {
        created_by_user_id: userId,
      },
      include: {
        creator: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });
  }
}
