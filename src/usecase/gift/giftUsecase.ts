import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/user/userRepository";
import { AuthUser } from "@/types/auth";
import { ParsedUser } from "@/types/user";
import { GIFT_SYSTEM } from "@/constant/systemConfig";
import { AppError } from "@/types/error/AppError";
import { logger } from "@/utils/logger";
import { prisma } from "@/lib/prisma";
import { Recoverable } from "repl";

type QuestionAnswer = {
	questionId: string;
	optionText: string;
};

type RecipientData = {
	username: string;
	nickname: string;
	educationLevel: string;
	questionAnswers: Array<QuestionAnswer>;
};

export class GiftUsecase {
	private giftRepository: GiftRepository;
	private userRepository: UserRepository;

	constructor(giftRepository: GiftRepository) {
		this.giftRepository = giftRepository;
		this.userRepository = new UserRepository();
	}

	async sendGift(
		sender: AuthUser | undefined,
		data: RecipientData
	): Promise<{ statusCode: number; message: string }> {
		// this validates the input
		this.validateGiftSendBody(data);

		const senderData = await this.userRepository.getParsedUserById(
			sender?.id || ""
		);
		const recipientData = await this.userRepository.getUserByUsername(
			data?.username.toLowerCase() || ""
		);

		// this validates the fetched data
		this.validateGiftSend(senderData, recipientData);

		// TODO: validate reset time

		// this validates the recipient info
		// (icebreaking questions and the such)
		this.validateRecipientDataAccuracy(data, recipientData);

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
		if (!recipient.answers) {
			throw new AppError("Recipient answer data not found", 404);
		}
		if (sender.username === recipient.username) {
			throw new AppError("Can't send gift to yourself!", 403);
		}
		if (sender.wallets.gift_sends_remaining <= 0) {
			throw new AppError("You ran out of gift sends.", 403);
		}
	}

	private validateGiftSendBody(data: RecipientData) {
		const USERNAME_REGEX = /^[npNP][0-9]+$/;
		if (typeof data.username !== "string") {
			throw new AppError("Recipient format invalid", 400);
		}
		if (!USERNAME_REGEX.test(data.username)) {
			throw new AppError("Recipient username invalid", 400);
		}
	}

	private validateRecipientDataAccuracy(
		answer: RecipientData,
		recipientData: ParsedUser | null
	) {
		const wrongAnswers: Array<string> = [];

		if (!recipientData) {
			throw new AppError("Recipient not found", 404);
		}

		if (!recipientData.answers) {
			throw new AppError("Recipient answer data not found", 404);
		}

		// shouldn't go in
		if (answer.username.toLowerCase() !== recipientData.username) {
			wrongAnswers.push("Username");
		}

		if (answer.nickname !== recipientData.nickname) {
			wrongAnswers.push("Nickname");
		}

		if (answer.educationLevel !== recipientData.educationLevel) {
			wrongAnswers.push("Education Level");
		}

		let number = 0;
		const recipientAnswers: Map<string, string> = new Map();
		for (const answer of recipientData.answers) {
			recipientAnswers.set(answer.questionId, answer.answer);
		}

		for (const questionAnswer of answer.questionAnswers) {
			number++;
			if (
				questionAnswer.optionText !==
				recipientAnswers.get(questionAnswer.questionId)
			) {
				wrongAnswers.push(`Question #${number}`);
			}
		}

		const wrongAnswerList = wrongAnswers.join(", ");
		if (wrongAnswers.length > 0) {
			throw new AppError(
				`Sender gave wrong answer to recipient: ${wrongAnswerList}`,
				400
			);
		}
	}
}
