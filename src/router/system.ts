import { SystemController } from '@/controller/system/systemController';
import { SystemRepository } from '@/repository/system/systemRepository';
import { SystemUsecase } from '@/usecase/system/systemUsecase';
import { authMiddleware } from '@/middleware/authMiddleware';
import { Router } from 'express';
import { prisma } from '@/lib/prisma';

export default function systemRouter() {
  const router = Router();
  const systemRepository = new SystemRepository(prisma);
  const systemUsecase = new SystemUsecase(systemRepository);
  const systemController = new SystemController(systemUsecase);

  // POST /api/system/toggle - Toggle system settings (Admin only)
  router.post(
    '/toggle',
    authMiddleware,
    systemController.toggleSystem.bind(systemController),
  );

  // GET /api/system/status - Get system status (All users)
  router.get(
    '/status',
    systemController.getSystemStatus.bind(systemController),
  );

  router.patch(
    '/set',
    authMiddleware,
    systemController.setSystemSetting.bind(systemController),
  )

  return router;
}
