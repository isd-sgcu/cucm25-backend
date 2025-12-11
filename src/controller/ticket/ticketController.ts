import { AuthenticatedRequest } from '@/types/auth';
import { AppError } from '@/types/error/AppError';
import { TicketUsecase } from '@/usecase/ticket/ticketUsecase';
import { RoleType } from '@prisma/client';
import type { Request, Response } from 'express';

export class TicketController {
  private ticketUsecase: TicketUsecase;

  constructor(ticketUsecase: TicketUsecase) {
    this.ticketUsecase = ticketUsecase;
  }

  async getPrice(req: Request, res: Response) {
    try {
      const ticketPrice = await this.ticketUsecase.getTicketPrice();
      res.status(200).json({ success: true, data: ticketPrice });
    } catch (error) {
      throw new AppError('Failed to get ticket price', 500);
    }
  }

  async buyTicket(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    // Validate fields
    if (
      req.body.quantity === undefined ||
      typeof req.body.quantity !== 'number' ||
      req.body.quantity <= 0
    ) {
      throw new AppError('Invalid quantity', 400);
    }

    if (req.body.event_name && typeof req.body.event_name !== 'string') {
      throw new AppError('Invalid event name', 400);
    }

    try {
      const purchase = await this.ticketUsecase.buyTicket(
        req.user!,
        req.body.quantity,
        req.body.event_name ? req.body.event_name : undefined,
      );
      if (purchase.success) {
        res.status(200).json({
          success: true,
          message: purchase.message,
          data: purchase.data,
        });
      } else {
        res.status(400).json({ success: false, message: purchase.message });
      }
    } catch (error) {
      throw new AppError('Failed to buy ticket', 500);
    }
  }

  async exportPurchaseHistory(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== RoleType.ADMIN) {
      throw new AppError('Insufficient Permissions', 403);
    }
    // Validate query parameters
    if (
      'start_time' in req.query &&
      'end_time' in req.query &&
      req.query.start_time !== undefined &&
      req.query.end_time !== undefined
    ) {
      const start = new Date(req.query.start_time as string);
      const end = new Date(req.query.end_time as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        throw new AppError('Invalid date range', 400);
      }
    } else if (
      'event_name' in req.query &&
      req.query.event_name !== undefined
    ) {
      if (typeof req.query.event_name !== 'string') {
        throw new AppError('Invalid event name', 400);
      }
    } else {
      throw new AppError('Invalid query parameters', 400);
    }

    try {
      const purchasesResponse = await this.ticketUsecase.getTicketPurchases(
        req.query as
          | { start_time: string; end_time: string }
          | { event_name: string },
        Boolean(req.query.randomize),
      );

      if (purchasesResponse.success) {
        res.status(200).json({
          success: true,
          data: purchasesResponse.data,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to export tickets',
        });
      }
    } catch (error) {
      throw new AppError('Failed to export tickets', 500);
    }
  }

  async downloadPurchaseHistory(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== RoleType.ADMIN) {
      throw new AppError('Insufficient Permissions', 403);
    }
    // Validate query parameters
    if (
      'start_time' in req.query &&
      'end_time' in req.query &&
      req.query.start_time !== undefined &&
      req.query.end_time !== undefined
    ) {
      const start = new Date(req.query.start_time as string);
      const end = new Date(req.query.end_time as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        throw new AppError('Invalid date range', 400);
      }
    } else if (
      'event_name' in req.query &&
      req.query.event_name !== undefined
    ) {
      if (typeof req.query.event_name !== 'string') {
        throw new AppError('Invalid event name', 400);
      }
    } else {
      throw new AppError('Invalid query parameters', 400);
    }

    try {
      const fileStream = await this.ticketUsecase.downloadTicketExport(
        req.query as
          | { start_time: string; end_time: string }
          | { event_name: string },
        Boolean(req.query.randomize),
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=ticket_purchases.csv',
      );
      res.setHeader('Content-Type', 'text/csv');
      fileStream.pipe(res);
    } catch (error) {
      throw new AppError('Failed to download ticket export', 500);
    }
  }
}
