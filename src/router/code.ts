import { CodeController } from '@/controller/code';
import { CodeRepository } from '@/repository/code';
import { CodeUsecase } from '@/usecase/code';
import { authMiddleware } from '@/middleware/authMiddleware';
import { Router } from 'express';

export default function codeRouter() {
  const router = Router();
  const codeRepository = new CodeRepository();
  const codeUsecase = new CodeUsecase(codeRepository);
  const codeController = new CodeController(codeUsecase);

  // POST /api/code/generate - requires authentication
  router.post(
    '/generate',
    authMiddleware(),
    codeController.generateCode.bind(codeController),
  );

  // POST /api/code/redeem - requires authentication
  router.post(
    '/redeem',
    authMiddleware(),
    codeController.redeemCode.bind(codeController),
  );

  // GET /api/code/history - requires authentication
  router.get(
    '/history',
    authMiddleware(),
    codeController.getCodeHistory.bind(codeController),
  );

  return router;
}
