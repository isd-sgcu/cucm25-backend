import { SYSTEM_DEFAULTS } from "@/constant/systemConfig";
import { prisma } from "@/lib/prisma";
import { WalletRepository } from "../wallet/walletRepository";
import { TicketPurchase } from "@prisma/client";

export class TicketRepository {
  constructor() {}

  async getTicketPrice(): Promise<{ price: number; lastUpdated: Date | null }> {
    const ticket_price = await prisma.systemSetting.findUnique({
      where: { setting_key: "ticket_price" },
    });
    return {
      price: parseInt(
        ticket_price?.setting_value || SYSTEM_DEFAULTS.TICKET_PRICE
      ),
      lastUpdated: ticket_price?.updated_at || null,
    };
  }

  async buyTickets(
    userId: string,
    quantity: number,
    event_name?: string
  ): Promise<{ total: number; purchase_at: Date }> {
    const { price } = await this.getTicketPrice();
    const totalCost = price * quantity;

    const time = new Date();

    await prisma.ticketPurchase.create({
      data: {
        user_id: userId,
        event_name: event_name || null,
        count: quantity,
        ticket_price: price,
        total_price: totalCost,
        purchase_at: time,
      },
    });
    return { total: totalCost, purchase_at: time };
  }

  async getTicketPurchases(
    query: { start_time: string; end_time: string } | { event_name: string }
  ): Promise<{ count: number; purchases: (TicketPurchase & { user: any })[] }> {
    const where: any = {};

    if ("start_time" in query && "end_time" in query) {
      where.purchase_at = {
        gte: new Date(query.start_time),
        lte: new Date(query.end_time),
      };
    } else if ("event_name" in query) {
      where.event_name = query.event_name;
    }

    const purchases = await prisma.ticketPurchase.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            firstname: true,
            lastname: true,
            role: true,
          },
        },
      },
      orderBy: { purchase_at: "asc" },
    });

    return { count: purchases.length, purchases };
  }
}
