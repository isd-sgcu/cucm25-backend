import { AuthController } from '@/controller/auth';
import { authMiddleware } from '@/middleware/authMiddleware';
import { UserRepository } from '@/repository/user';
import { AuthUsecase } from '@/usecase/auth';
import { Router } from 'express';

export default function authRouter() {
  const router = Router();
  const userRepository = new UserRepository();
  const authUsecase = new AuthUsecase(userRepository);
  const authController = new AuthController(authUsecase);

  router.post('/login', authController.login.bind(authController));
  router.get('/me', authMiddleware(true), authController.me.bind(authController));

  return router;
}
