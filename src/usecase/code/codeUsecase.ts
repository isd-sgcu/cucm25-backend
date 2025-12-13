import { CodeRepository } from '@/repository/code/codeRepository';
import { AppError } from '@/types/error/AppError';
import { Prisma } from '@prisma/client';
import {
  ROLE_MAPPINGS,
  DATABASE_ROLES,
  TARGET_ROLES,
} from '@/constant/systemConfig';
import {
  GenerateCodeRequest,
  GenerateCodeResponse,
  RedeemCodeResponse,
} from '@/types/code';

export interface ICodeUsecase {
  generateCode(
    data: GenerateCodeRequest,
    creatorUserId: string,
  ): Promise<GenerateCodeResponse>;
  redeemCode(codeString: string, userId: string): Promise<RedeemCodeResponse>;
}

export class CodeUsecase implements ICodeUsecase {
  constructor(private codeRepository: CodeRepository) {}

  async generateCode(
    data: GenerateCodeRequest,
    creatorUserId: string,
  ): Promise<GenerateCodeResponse> {
    // Generate unique code string automatically
    const codeString = await this.codeRepository.generateUniqueCodeString();

    const creator = await this.codeRepository.getUserWithRole(creatorUserId);
    if (!creator) {
      throw new AppError('User not found', 404);
    }

    const creatorRole = creator.role;
    if (
      creatorRole !== DATABASE_ROLES.MODERATOR &&
      creatorRole !== DATABASE_ROLES.ADMIN
    ) {
      throw new AppError('Only moderators and admins can generate codes', 403);
    }

    if (
      creatorRole === DATABASE_ROLES.MODERATOR &&
      data.targetRole !== TARGET_ROLES.JUNIOR
    ) {
      throw new AppError('Moderators can only create junior-only codes', 403);
    }

    if (data.rewardCoin <= 0) {
      throw new AppError('Reward coin must be greater than zero', 400);
    }

    // Parse and validate expiration date (required)
    const expiresAt = new Date(data.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      throw new AppError('Invalid expiration date format', 400);
    }
    if (expiresAt <= new Date()) {
      throw new AppError('Expiration date must be in the future', 400);
    }

    const code = await this.codeRepository.createCode({
      codeString: codeString,
      targetRole: data.targetRole,
      activityName: data.activityName,
      rewardCoin: data.rewardCoin,
      createdByUserId: creatorUserId,
      expiresAt: expiresAt,
    });

    // Validate required fields from database
    if (!code.expires_at) {
      throw new AppError('Code expiration date is missing from database', 500);
    }
    if (!code.created_at) {
      throw new AppError('Code creation date is missing from database', 500);
    }

    return {
      id: code.id,
      codeString: code.code_string,
      targetRole: code.target_role,
      activityName: code.activity_name,
      rewardCoin: code.reward_coin,
      createdByUserId: code.created_by_user_id,
      expiresAt: code.expires_at.toISOString(),
      createdAt: code.created_at.toISOString(),
    };
  }

  async redeemCode(
    codeString: string,
    userId: string,
  ): Promise<RedeemCodeResponse> {
    const code = await this.codeRepository.findCodeByString(codeString);
    if (!code) {
      throw new AppError('Code not found', 404);
    }

    if (code.expires_at && code.expires_at < new Date()) {
      throw new AppError('Code has expired', 400);
    }

    const user = await this.codeRepository.getUserWithRole(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userRole = user.role;

    // Map RoleType enum to target role strings using shared config
    const mappedUserRole =
      ROLE_MAPPINGS[userRole as keyof typeof ROLE_MAPPINGS] ||
      ROLE_MAPPINGS.PARTICIPANT;

    if (
      code.target_role !== TARGET_ROLES.ALL &&
      code.target_role !== mappedUserRole
    ) {
      throw new AppError(`This code is only for ${code.target_role} role`, 403);
    }

    const [redemption, transaction, wallet] = await this.codeRepository.redeemCode(userId, code.id);

    return {
      success: true,
      message: `Successfully redeemed code: ${code.activity_name}`,
      rewardCoin: code.reward_coin,
      newBalance: wallet.coin_balance,
      transactionId: transaction.id,
      redeemedAt: redemption.redeemed_at!.toISOString(),
    };
  }
}
