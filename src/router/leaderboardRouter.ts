import { LeaderboardController } from '@/controller/leaderboard';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserRepository } from '@/repository/user';
import { LeaderboardUsecase } from '@/usecase/leaderboard';
import { Router } from 'express';

export default function leaderboardRouter() {
  const router = Router();
  const userRepository = new UserRepository();
  const leaderboardUsecase = new LeaderboardUsecase(userRepository);
  const leaderboardController = new LeaderboardController(leaderboardUsecase);

  router.get(
    '/',
    authMiddleware(),
    leaderboardController.get.bind(leaderboardController),
  );

  return router;
}
