import { UserController } from '@/controller/user/userController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserRepository } from '@/repository/user/userRepository';
import { WalletRepository } from '@/repository/wallet/walletRepository';
import { UserUsecase } from '@/usecase/user/userUsecase';
import { Router } from 'express';

export default function userRouter() {
  const router = Router();
  const userRepository = new UserRepository();
  const walletRepository = new WalletRepository();
  const userUsecase = new UserUsecase(userRepository, walletRepository);
  const userController = new UserController(userUsecase);

  router.post(
    '/onboarding',
    authMiddleware,
    userController.onboarding.bind(userController),
  );
  router.post(
    '/reset',
    authMiddleware,
    userController.reset.bind(userController),
  );
  router.get('/:id', authMiddleware, userController.get.bind(userController));

  router.post('/pay', authMiddleware, userController.pay.bind(userController));

  return router;
}
