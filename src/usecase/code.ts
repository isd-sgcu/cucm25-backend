import { CodeRepository } from '@/repository/code';
import { AppError } from '@/types/error/AppError';
import {
  TARGET_ROLES,
  BUSINESS_RULES,
  ROLE_MAPPINGS,
} from '@/constant/systemConfig';
import {
  CodeHistoryResponse,
  GenerateCodeRequest,
  GenerateCodeResponse,
  RedeemCodeResponse,
} from '@/types/code';
import { randomInt } from 'crypto';
import { logger } from '@/utils/logger';
import { AuthUser } from '@/types/auth';

const GENERATION_RULES = BUSINESS_RULES.CODE_GENERATION;

export class CodeUsecase {
  constructor(private codeRepository: CodeRepository) {}

  async generateCode(
    data: GenerateCodeRequest,
    user: AuthUser,
  ): Promise<GenerateCodeResponse> {
    // Generate unique code string automatically
    const codeString = await this.generateUniqueCodeString();

    const creatorRole = user.role;
    if (creatorRole !== 'MODERATOR' && creatorRole !== 'ADMIN') {
      throw new AppError('Only moderators and admins can generate codes', 403);
    }

    if (
      creatorRole === 'MODERATOR' &&
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
      createdByUserId: user.id,
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
    user: AuthUser,
  ): Promise<RedeemCodeResponse> {
    const code = await this.codeRepository.findCodeByString(codeString);
    if (!code) {
      throw new AppError('Code not found', 404);
    }

    if (code.expires_at && code.expires_at < new Date()) {
      throw new AppError('Code has expired', 400);
    }

    const userRole = user.role;

    if (
      code.target_role !== TARGET_ROLES.ALL &&
      code.target_role !== ROLE_MAPPINGS[userRole as keyof typeof ROLE_MAPPINGS]
    ) {
      throw new AppError(`This code is only for ${code.target_role} role`, 403);
    }

    const [redemption, transaction, wallet] =
      await this.codeRepository.redeemCode(user.id, code);

    return {
      success: true,
      message: `Successfully redeemed code: ${code.activity_name}`,
      rewardCoin: code.reward_coin,
      newBalance: wallet.coin_balance,
      transactionId: transaction.id,
      redeemedAt: redemption.redeemed_at!.toISOString(),
    };
  }

  async getCodeHistory(user: AuthUser): Promise<CodeHistoryResponse> {
    const userRole = user.role;
    if (userRole !== 'MODERATOR' && userRole !== 'ADMIN') {
      throw new AppError(
        'Only moderators and admins can view generated codes',
        403,
      );
    }

    const data = await this.codeRepository.getSelfCreatedCodes(user.id);

    return { data };
  }

  private async generateUniqueCodeString(): Promise<string> {
    const MAX_RETRIES = GENERATION_RULES.MAX_RETRIES;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;

      // Generate 1 uppercase letter (A-Z) = 26 combinations
      let letter = '';
      for (let i = 0; i < GENERATION_RULES.FORMAT.LETTER_COUNT; i++) {
        const letterIndex = randomInt(0, 26);
        letter += String.fromCharCode(65 + letterIndex);
      }

      // Generate 3 digits (000-999) = 1,000 combinations
      const numbers = randomInt(0, 1000)
        .toString()
        .padStart(GENERATION_RULES.FORMAT.NUMBER_COUNT, '0');

      // Total combinations = 26 × 1,000 = 26,000 possible codes
      const codeString = letter + numbers;

      // Check if code already exists
      const existingCode =
        await this.codeRepository.findCodeByString(codeString);
      if (!existingCode) {
        return codeString;
      }

      // Log warning เมื่อเริ่มมี collision บ่อย
      if (attempts > GENERATION_RULES.WARNING_THRESHOLD) {
        logger.warn('CodeRepository', 'Code generation collision detected', {
          attempt: attempts,
          maxRetries: MAX_RETRIES,
          codeFormat: `${letter}${numbers}`,
        });
      }
    }

    // If all attempts failed, use timestamp-based fallback for guaranteed uniqueness
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
    const existingFallback =
      await this.codeRepository.findCodeByString(fallbackCode);
    if (!existingFallback) {
      return fallbackCode;
    }

    // If even fallback code exists, throw error
    throw new AppError(
      'Unable to generate unique code after maximum retries. Please try again or contact support.',
      500,
    );
  }
}
