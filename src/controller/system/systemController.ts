import { ISystemUsecase } from '@/usecase/system/systemUsecase';
import { Request, Response } from 'express';
import { AppError } from '@/types/error/AppError';
import { logger } from '@/utils/logger';

export class SystemController {
  constructor(private systemUsecase: ISystemUsecase) {}

  async toggleSystem(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from JWT token (set by authMiddleware)
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }

      const { settingKey, enabled } = req.body;

      // Validation
      if (!settingKey || enabled === undefined) {
        res.status(400).json({
          error: 'Missing required fields: settingKey, enabled',
        });
        return;
      }

      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          error: "Field 'enabled' must be a boolean",
        });
        return;
      }

      const result = await this.systemUsecase.toggleSystemSetting(
        { settingKey, enabled },
        adminUserId,
      );

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
        logger.error('SystemController', 'Toggle system error', error);
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }

  async setSystemSetting(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from JWT token (set by authMiddleware)
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        res.status(401).json({
          error: 'Authentication required',
        });
        return;
      }
      
      const result = await this.systemUsecase.setSystemSetting(
        adminUserId,
        req.body,
      );
      
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
        logger.error('SystemController', 'Set system setting error', error);
        res.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  }

  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.systemUsecase.getSystemStatus();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('SystemController', 'Get system status error', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}
