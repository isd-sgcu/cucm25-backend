import { UserController } from '@/controller/user';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserRepository } from '@/repository/user';
import { WalletRepository } from '@/repository/wallet';
import { UserUsecase } from '@/usecase/user';
import { Router } from 'express';

export default function userRouter() {
  const router = Router();
  const userRepository = new UserRepository();
  const walletRepository = new WalletRepository();
  const userUsecase = new UserUsecase(userRepository, walletRepository);
  const userController = new UserController(userUsecase);

  router.post(
    '/onboarding',
    authMiddleware(),
    userController.onboarding.bind(userController),
  );
  router.post(
    '/reset',
    authMiddleware(),
    userController.reset.bind(userController),
  );
  router.get('/:id', authMiddleware(), userController.get.bind(userController));

  router.post(
    '/pay',
    authMiddleware(),
    userController.pay.bind(userController),
  );

  router.patch(
    '/adjust-coins',
    authMiddleware(),
    userController.adjustCoins.bind(userController),
  );

  router.put(
    '/adjust-coins',
    authMiddleware(),
    userController.bulkAdjustCoins.bind(userController),
  );

  return router;
}
