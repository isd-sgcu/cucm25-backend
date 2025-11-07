import { AuthUser } from "@/types/auth";
import { AppError } from "@/types/error/AppError";
import { GiftUsecase } from "@/usecase/gift/giftUsecase";
import type { Request, Response } from "express";

export class GiftController {
	private giftUsecase: GiftUsecase;

	constructor(giftUsecase: GiftUsecase) {
		this.giftUsecase = giftUsecase;
	}

	// async giftPing(_req: Request, res: Response): Promise<void> {
	// 	try {
	// 		await this.giftUsecase.pingDB();
	// 		res.status(200).json({ message: "Gift Rider!" });
	// 	} catch (error) {
	// 		if (error instanceof AppError) {
	// 			res.status(error.statusCode).json({
	// 				message: error.message,
	// 			});
	// 			return;
	// 		}
	// 		console.error("Error something:", error);
	// 		res.status(500).json({
	// 			message: "An unexpected error occurred",
	// 		});
	// 	}
	// }

	async sendGift(_req: Request, res: Response): Promise<void> {
		try {
			// FIXME: Add data validation
			const sender = _req.user;
			const recipient = _req.body.recipient;
			const amount = parseInt(_req.body.amount);

			const result: {
				statusCode: number;
				message: string;
				newAmount: number;
			} = await this.giftUsecase.sendGift(
				sender as AuthUser,
				recipient,
				amount
			);

			res.status(result.statusCode).json({
				message: result.message,
				newAmount: result.newAmount,
			});
		} catch (error) {
			if (error instanceof AppError) {
				res.status(error.statusCode).json({
					message: error.message,
				});
				return;
			}
			console.error("Error something:", error);
			res.status(500).json({
				message: "An unexpected error occurred",
			});
		}
	}
}
