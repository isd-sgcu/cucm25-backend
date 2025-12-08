import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/user/userRepository";
import { AuthUser } from "@/types/auth";
import { ParsedUser } from "@/types/user";
import { GIFT_SYSTEM } from "@/constant/systemConfig";
import { AppError } from "@/types/error/AppError";
import { logger } from "@/utils/logger";
import { prisma } from "@/lib/prisma";

export class GiftUsecase {
	private giftRepository: GiftRepository;
	private userRepository: UserRepository;

	constructor(giftRepository: GiftRepository) {
		this.giftRepository = giftRepository;
		this.userRepository = new UserRepository();
	}

	async sendGift(
		sender: AuthUser | undefined,
		target: string
	): Promise<{ statusCode: number; message: string }> {
		const senderData = await this.userRepository.getParsedUserById(
			sender?.id || ""
		);
		const recipientData = await this.userRepository.getUserByUsername(
			target
		);

		this.validateGiftSend(senderData, recipientData);

		/**
		 * Actually send the gift:
		 * - Deduct 1 from the sender's quota
		 * - Add 100 currency to `recipient`'s wallet.
		 * - Log the transaction.
		 */

		const amount = GIFT_SYSTEM.DEFAULT_VALUE;

		const senderId = (senderData as ParsedUser).id;
		const recipientId = (recipientData as ParsedUser).id;
		const senderUsername = (senderData as ParsedUser).username;
		const recipientUsername = (recipientData as ParsedUser).username;

		await prisma.$transaction(async (tx) => {
			// Deduct 1 from the sender's quota
			await tx.user.update({
				where: { id: senderId },
				data: {
					wallets: {
						update: {
							where: {
								user_id: senderId,
							},
							data: {
								gift_sends_remaining: { decrement: 1 },
							},
						},
					},
				},
			});
			// Add 100 to `recipient`'s wallet
			await tx.user.update({
				where: { id: recipientId },
				data: {
					wallets: {
						update: {
							where: {
								user_id: recipientId,
							},
							data: {
								coin_balance: {
									increment: GIFT_SYSTEM.DEFAULT_VALUE,
								},
								cumulative_coin: {
									increment: GIFT_SYSTEM.DEFAULT_VALUE,
								},
							},
						},
					},
				},
			});
			await tx.transaction.create({
				data: {
					sender_user_id: senderId,
					recipient_user_id: recipientId,
					type: "GIFT",
					coin_amount: amount,
				},
			});
		});

		logger.info(
			"GiftUsecase",
			`${senderUsername} successfully sent ${amount} coins (as 1 gift) to ${recipientUsername}.`
		);

		return {
			statusCode: 200,
			message: "Gift successfully sent!",
		};
	}

	private validateGiftSend(
		sender: ParsedUser | null,
		recipient: ParsedUser | null
	) {
		if (!sender) {
			throw new AppError("Sender account not found", 500);
		}
		if (!sender.wallets) {
			throw new AppError("Sender wallet not found", 500);
		}
		if (!recipient) {
			throw new AppError("Recipient not found", 404);
		}
		if (!recipient.wallets) {
			throw new AppError("Recipient wallet not found", 404);
		}
		if (sender.username === recipient.username) {
			throw new AppError("Can't send gift to yourself!", 403);
		}
		if (sender.wallets.gift_sends_remaining <= 0) {
			throw new AppError("You ran out of gift sends.", 403);
		}
	}
}
