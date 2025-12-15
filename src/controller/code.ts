import { CodeUsecase } from '@/usecase/code';
import { Response } from 'express';
import { AppError } from '@/types/error/AppError';
import { logger } from '@/utils/logger';
import { TARGET_ROLES } from '@/constant/systemConfig';
import { AuthenticatedRequest } from '@/types/auth';

export class CodeController {
  constructor(private codeUsecase: CodeUsecase) {}

  async generateCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get user ID from JWT token (set by authMiddleware)
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }

      const { targetRole, activityName, rewardCoin, expiresAt } = req.body;

      // Validation
      const missingFields: string[] = [];
      if (!targetRole) missingFields.push('targetRole');
      if (!activityName) missingFields.push('activityName');
      if (rewardCoin === undefined) missingFields.push('rewardCoin');
      if (!expiresAt) missingFields.push('expiresAt');

      if (missingFields.length > 0) {
        res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      const validTargetRoles = Object.values(TARGET_ROLES);
      if (!validTargetRoles.includes(targetRole)) {
        res.status(400).json({
          error: `targetRole must be one of: ${validTargetRoles.join(', ')}`,
        });
        return;
      }

      const result = await this.codeUsecase.generateCode(
        {
          targetRole,
          activityName,
          rewardCoin: Number(rewardCoin),
          expiresAt,
        },
        req.user,
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
      } else {
        logger.error('CodeController', 'Generate code error', error);
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }

  async redeemCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get user ID from JWT token (set by authMiddleware)
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }

      const { codeString } = req.body;

      if (!codeString) {
        res.status(400).json({
          error: 'codeString is required',
        });
        return;
      }

      const result = await this.codeUsecase.redeemCode(codeString, user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
      } else {
        logger.error('CodeController', 'Redeem code error', error);
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }

  async getCodeHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get user ID from JWT token (set by authMiddleware)
      const user = req.user;

      if (!user) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.codeUsecase.getCodeHistory(user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          error: error.message,
        });
      } else {
        logger.error('CodeController', 'Code history retrieval error', error);
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }
}
