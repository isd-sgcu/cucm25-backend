import { GiftController } from '@/controller/gift/giftController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { GiftRepository } from '@/repository/gift/giftRepository';
import { GiftUsecase } from '@/usecase/gift/giftUsecase';
import { Router } from 'express';

export default function giftRouter() {
  const router = Router();
  const giftRepository = new GiftRepository();
  const giftUsecase = new GiftUsecase(giftRepository);
  const giftController = new GiftController(giftUsecase);

  router.post(
    '/send',
    authMiddleware,
    giftController.sendGift.bind(giftController),
  );

  return router;
}
