import { TicketRepository } from '@/repository/ticket';
import { WalletRepository } from '@/repository/wallet';
import { AuthUser } from '@/types/auth';
import { Parser } from '@json2csv/plainjs';
import { TicketPurchase } from '@prisma/client';
import { Readable } from 'stream';

export class TicketUsecase {
  private ticketRepository: TicketRepository;
  private walletRepository: WalletRepository;

  constructor(
    ticketRepository: TicketRepository,
    walletRepository: WalletRepository,
  ) {
    this.ticketRepository = ticketRepository;
    this.walletRepository = walletRepository;
  }

  async getTicketPrice(): Promise<{
    price: number;
    lastUpdated: string | null;
  }> {
    const { price, lastUpdated } = await this.ticketRepository.getTicketPrice();
    return {
      price,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    };
  }

  async buyTicket(
    user: AuthUser,
    quantity: number,
    event_name?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      total: number;
      purchase_at: Date;
    };
  }> {
    try {
      const { price } = await this.ticketRepository.getTicketPrice();
      const totalCost = price * quantity;

      const wallet = await this.walletRepository.getUserWallet(user.id);
      if (!wallet || wallet.coin_balance < totalCost) {
        throw new Error('Insufficient coin balance');
      }

      const { total, purchase_at } = await this.ticketRepository.buyTickets(
        user.id,
        quantity,
        event_name,
      );

      return {
        success: true,
        message: `Successfully purchased ${quantity} tickets for a total of ${total}.`,
        data: { total, purchase_at },
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async getTicketPurchases(
    query: { start_time: string; end_time: string } | { event_name: string },
    randomize: boolean = false,
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const { start_time, end_time, event_name } = query as any;

      const { purchases } = await this.ticketRepository.getTicketPurchases(
        start_time ? { start_time, end_time } : { event_name },
      );

      const sanitizedPurchases = this.sanitizePurchasesExport(
        purchases,
        randomize,
      );

      return { success: true, data: sanitizedPurchases };
    } catch (error) {
      return { success: false, data: (error as Error).message };
    }
  }

  async downloadTicketExport(
    query: { start_time: string; end_time: string } | { event_name: string },
    randomize: boolean = false,
  ): Promise<NodeJS.ReadableStream> {
    const { success, data } = await this.getTicketPurchases(query, randomize);

    if (!success || !data) {
      throw new Error('Failed to generate ticket export');
    }

    const parser = new Parser();
    const csvData = parser.parse(data);

    return Readable.from([csvData]);
  }

  private sanitizePurchasesExport(
    purchases: (TicketPurchase & { user: any })[],
    randomize: boolean,
  ): any[] {
    const sanitizedPurchases = [];

    for (const purchase of purchases) {
      for (let i = 0; i < purchase.count; i++) {
        const sanitizedPurchase: any = {
          purchase_id: purchase.id,
          event_name: purchase.event_name,
          ticket_price: purchase.ticket_price,
          user_id: purchase.user.id,
          username: purchase.user.username,
          nickname: purchase.user.nickname,
          fullname: `${purchase.user.firstname} ${purchase.user.lastname}`,
          purchase_at: purchase.purchase_at,
        };

        sanitizedPurchases.push(sanitizedPurchase);
      }
    }

    if (randomize) {
      for (let i = sanitizedPurchases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sanitizedPurchases[i], sanitizedPurchases[j]] = [
          sanitizedPurchases[j],
          sanitizedPurchases[i],
        ];
      }
    }

    return sanitizedPurchases;
  }
}
