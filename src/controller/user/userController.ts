import { AuthenticatedRequest } from '@/types/auth/index';
import { AppError } from '@/types/error/AppError';
import type { GetUserRequest } from '@/types/user/GET';
import { UserUsecase } from '@/usecase/user/userUsecase';
import type { Response } from 'express';

export class UserController {
  private userUsecase: UserUsecase;

  constructor(userUsecase: UserUsecase) {
    this.userUsecase = userUsecase;
  }

  async get(req: GetUserRequest, res: Response): Promise<void> {
    try {
      const user = await this.userUsecase.getUser(req.user!, req.params);
      res.status(200).json({ user });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      console.error('Get user error:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }

  async onboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.userUsecase.createOnboarding(req.user!, req.body);
      res.status(200).json({ message: 'Create onboarding successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      console.error('Create onboarding error:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }

  async reset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.userUsecase.resetOnboarding(req.user!, req.body);
      res.status(200).json({ message: 'Reset user successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      console.error('Reset user error:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }

  async pay(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    try {
      await this.userUsecase.pay(req.user, req.body.amount);
      res.status(200).json({ success: true, message: 'Payment successful' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Payment error:', error);
        res.status(500).json({
          success: false,
          message: 'An unexpected error occurred',
        });
      }
    }
  }

  async adjustCoins(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    try {
      const { amount, action, username } = req.body;
      await this.userUsecase.adjustCoins(req.user, username, amount, action);
      res.status(200).json({ success: true, message: 'Wallet adjusted successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Adjust wallet error:', error);
        res.status(500).json({
          success: false,
          message: 'An unexpected error occurred',
        });
      }
    }
  }
}
