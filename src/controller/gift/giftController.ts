import { AppError } from "@/types/error/AppError";
import { GiftUsecase } from "@/usecase/gift/giftUsecase";
import type { Request, Response } from "express";

export class GiftController {
	private giftUsecase: GiftUsecase;

	constructor(giftUsecase: GiftUsecase) {
		this.giftUsecase = giftUsecase;
	}

	async sendGift(_req: Request, res: Response): Promise<void> {
		try {
			const sender = _req.user;
			const recipient = _req.body.recipient;

			const result: {
				statusCode: number;
				message: string;
			} = await this.giftUsecase.sendGift(sender, recipient);

			res.status(result.statusCode).json({
				message: result.message,
			});
		} catch (error) {
			if (error instanceof AppError) {
				res.status(error.statusCode).json({
					message: error.message,
				});
				return;
			}
			console.error("Error sending gift:", error);
			res.status(500).json({
				message: "An unexpected error occurred",
			});
		}
	}
}
