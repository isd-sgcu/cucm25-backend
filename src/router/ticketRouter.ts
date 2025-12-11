import { TicketController } from '@/controller/ticket/ticketController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { TicketRepository } from '@/repository/ticket/ticketRepository';
import { WalletRepository } from '@/repository/wallet/walletRepository';
import { TicketUsecase } from '@/usecase/ticket/ticketUsecase';
import { Router } from 'express';

export default function ticketRouter() {
  const router = Router();
  const ticketRepository = new TicketRepository();
  const walletRepository = new WalletRepository();
  const ticketUsecase = new TicketUsecase(ticketRepository, walletRepository);
  const ticketController = new TicketController(ticketUsecase);

  router.get('/price', ticketController.getPrice.bind(ticketController));

  router.post(
    '/buy',
    authMiddleware,
    ticketController.buyTicket.bind(ticketController),
  );

  router.get(
    '/export',
    authMiddleware,
    ticketController.exportPurchaseHistory.bind(ticketController),
  );

  router.get(
    '/export/download',
    authMiddleware,
    ticketController.downloadPurchaseHistory.bind(ticketController),
  );

  return router;
}
