import { AppError } from '@/types/error/AppError';
import type { GetLeaderboardRequest } from '@/types/leaderboard/GET';
import { LeaderboardUsecase } from '@/usecase/leaderboard';
import type { Response } from 'express';

export class LeaderboardController {
  private leaderboardUsecase: LeaderboardUsecase;

  constructor(leaderboardUsecase: LeaderboardUsecase) {
    this.leaderboardUsecase = leaderboardUsecase;
  }

  async get(req: GetLeaderboardRequest, res: Response): Promise<void> {
    try {
      const leaderboard = await this.leaderboardUsecase.getLeaderboard(
        req.query,
      );
      res.status(200).json({ leaderboard });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          message: error.message,
        });
        return;
      }
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        message: 'An unexpected error occurred',
      });
    }
  }
}
