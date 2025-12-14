import { TransactionController } from '@/controller/transaction';
import { authMiddleware } from '@/middleware/authMiddleware';
import { TransactionRepository } from '@/repository/transaction';
import { TransactionUsecase } from '@/usecase/transaction';
import { Router } from 'express';

export default function transactionRouter() {
  const router = Router();
  const transactionRepository = new TransactionRepository();
  const transactionUsecase = new TransactionUsecase(transactionRepository);
  const transactionController = new TransactionController(transactionUsecase);

  router.get(
    '/history/coins',
    authMiddleware,
    transactionController.getUserCoinTransactions.bind(transactionController),
  );

  router.get(
    '/history/gifts',
    authMiddleware,
    transactionController.getUserGiftTransactions.bind(transactionController),
  );

  return router;
}
