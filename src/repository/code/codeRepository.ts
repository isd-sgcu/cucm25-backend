import {
  Prisma,
  CodeRedemption,
  Transaction,
  Wallet,
  Code,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { AppError } from '@/types/error/AppError';
import { BUSINESS_RULES } from '@/constant/systemConfig';
import { logger } from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import { WalletRepository } from '../wallet/walletRepository';

export class CodeRepository {
  private WalletRepository: WalletRepository;

  constructor(walletRepository?: WalletRepository) {
    this.WalletRepository = walletRepository || new WalletRepository();
  }

  async generateUniqueCodeString(): Promise<string> {
    const MAX_RETRIES = BUSINESS_RULES.CODE_GENERATION.MAX_RETRIES;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;

      // Cryptographically secure random generation
      // Generate 1 uppercase letter (A-Z) = 26 combinations
      const letterIndex = randomInt(0, 26);
      const letter = String.fromCharCode(65 + letterIndex);

      // Generate 3 digits (000-999) = 1,000 combinations
      const numbers = randomInt(0, 1000).toString().padStart(3, '0');

      // Total combinations = 26 × 1,000 = 26,000 possible codes
      const codeString = letter + numbers;

      // Check if code already exists
      const existingCode = await this.findCodeByString(codeString);
      if (!existingCode) {
        return codeString;
      }

      // Log warning เมื่อเริ่มมี collision บ่อย
      if (attempts > BUSINESS_RULES.CODE_GENERATION.WARNING_THRESHOLD) {
        logger.warn('CodeRepository', 'Code generation collision detected', {
          attempt: attempts,
          maxRetries: MAX_RETRIES,
          codeFormat: `${letter}${numbers}`,
        });
      }
    }

    // // If all attempts failed, use timestamp-based fallback for guaranteed uniqueness
    // const timestamp = Date.now().toString().slice(-3) // Last 3 digits of timestamp
    // const fallbackCode = `X${timestamp}` // X + 3 digit timestamp

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let fallbackCode = '';
    for (let i = 0; i < 4; i++) {
      const idx = randomInt(0, chars.length);
      fallbackCode += chars.charAt(idx);
    }

    logger.warn(
      'CodeRepository',
      'Code generation reached max retries, using fallback',
      {
        maxRetries: MAX_RETRIES,
        fallbackCode,
      },
    );

    // Check if fallback code already exists (very unlikely)
    const existingFallback = await this.findCodeByString(fallbackCode);
    if (!existingFallback) {
      return fallbackCode;
    }

    // If even fallback code exists, throw error
    throw new AppError(
      'Unable to generate unique code after maximum retries. Please try again or contact support.',
      500,
    );
  }

  async createCode(data: {
    codeString: string;
    targetRole: string;
    activityName: string;
    rewardCoin: number;
    createdByUserId: string;
    expiresAt: Date;
  }): Promise<any> {
    const createData: any = {
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

  async findCodeByString(codeString: string): Promise<any | null> {
    return await prisma.code.findUnique({
      where: { code_string: codeString },
    });
  }

  async findCodeWithCreator(codeString: string): Promise<any | null> {
    return await prisma.code.findUnique({
      where: { code_string: codeString },
      include: { creator: true },
    });
  }

  async checkIfUserRedeemedCode(
    userId: string,
    codeId: number,
  ): Promise<boolean> {
    const redemption = await prisma.codeRedemption.findUnique({
      where: {
        user_id_code_id: {
          user_id: userId,
          code_id: codeId,
        },
      },
    });
    return redemption !== null;
  }

  async createRedemption(userId: string, codeId: number): Promise<any> {
    return await prisma.codeRedemption.create({
      data: {
        user_id: userId,
        code_id: codeId,
      },
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

  async updateWalletBalance(
    userId: string,
    newBalance: number,
  ): Promise<any | null> {
    return await prisma.wallet.update({
      where: { user_id: userId },
      data: {
        coin_balance: newBalance,
        updated_at: new Date(),
      },
    });
  }

  async getWalletByUserId(userId: string): Promise<any | null> {
    return await prisma.wallet.findUnique({
      where: { user_id: userId },
    });
  }

  async getUserWithRole(userId: string): Promise<any | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async executeTransaction<T>(
    callback: (prisma: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await prisma.$transaction(callback);
  }

  async getCodes(): Promise<any | null> {
    return await prisma.code.findMany({
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
