import { GiftController } from '@/controller/gift';
import { authMiddleware } from '@/middleware/authMiddleware';
import { GiftRepository } from '@/repository/gift';
import { GiftUsecase } from '@/usecase/gift';
import { Router } from 'express';

export default function giftRouter() {
  const router = Router();
  const giftRepository = new GiftRepository();
  const giftUsecase = new GiftUsecase(giftRepository);
  const giftController = new GiftController(giftUsecase);

  router.post(
    '/send',
    authMiddleware(),
    giftController.sendGift.bind(giftController),
  );

  return router;
}
