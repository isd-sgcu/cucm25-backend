import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/user/userRepository";
import { TransactionRepository } from "@/repository/transaction/transactionRepository";
import { AuthUser } from "@/types/auth";
import { ParsedUser } from "@/types/user";

const GIFT_VALUE = 100;

async function checkRecipientExistence(username: string | null) {
	if (!username) {
		console.warn("Recipient doesn't actually exist.");
		return false;
	}

	const userRepository = new UserRepository();
	// TODO: Unnecessary extra call just to check for existence.
	const recipient = await userRepository.getUserByUsername(username);

	if (!recipient) {
		console.warn("Recipient doesn't actually exist.");
		return false;
	}

	return true;
}

/* This function assumes sender already exists (this should've already been checked elsewhere.) */
/* This function assumes sender's wallet already exists (this should've already been checked elsewhere.) */
function checkSenderLimit(sender: ParsedUser) {
	if (!sender.wallets) {
		return false;
	}

	// TODO: Add timestamp checking to see if limit should be reset,
	// e.g. if the last time gift sent > 3600 then let it pass even if remaining is 0.

	if (sender.wallets.gift_sends_remaining <= 0) {
		console.warn("Sender ran out of gift sends in the time period.");
		return false;
	}
	return true;
}

export class GiftUsecase {
	private giftRepository: GiftRepository;

	constructor(giftRepository: GiftRepository) {
		this.giftRepository = giftRepository;
	}

	// TODO: Separate checking logic from actual sending logic?
	async sendGift(
		sender: AuthUser,
		recipientUsername: string
	): Promise<{ statusCode: number; message: string }> {
		let ok = true;

		const userRepository = new UserRepository();
		const senderData = await userRepository.getParsedUserById(sender.id);

		const recipient = await userRepository.getUserByUsername(
			recipientUsername
		);

		if (!senderData?.wallets) {
			console.error("Sender's wallet not found.");
			return {
				statusCode: 400,
				message: "Sender's wallet not found.",
			};
		}

		if (!recipient) {
			console.error("Recipient not found.");
			return {
				statusCode: 400,
				message: "Recipient not found.",
			};
		}

		const errors = [];

		if (sender.username === recipientUsername) {
			console.warn(
				`Unable to send gift for ${sender.username}: Sender and recipient are the same person.`
			);
			errors.push("Sender and recipient are the same person");
			ok = false;
		}

		if (!(await checkRecipientExistence(recipientUsername))) {
			console.warn(
				`Unable to send gift for ${sender.username}: Recipient ${recipientUsername} doesn't exist.`
			);
			errors.push("Recipient doesn't exist");
			ok = false;
		}

		if (!checkSenderLimit(senderData)) {
			console.warn(
				`Unable to send gift for ${sender.username}: Sender ran out of gift quotas.`
			);
			errors.push("Sender ran out of gift quotas");
			ok = false;
		}

		if (!ok) {
			const errorMessage = errors.join(", ") + ".";
			return {
				statusCode: 400,
				message: "Unable to send gift: " + errorMessage,
			};
		}

		/**
		 * Actually send the gift:
		 * - Deduct 1 from the sender's quota
		 * - Set the timestamp of the last gift send to this time.
		 * - Add 100 currency to `recipient`'s wallet.
		 * - Log the transaction. // TODO: the `timestamp` variable and the timestamp in the record may be different.
		 */

		const timestamp = new Date();

		// TODO: make atomic???
		await userRepository.addSendingQuota(senderData.id, -1);
		// await userRepository.setLastSendTime(senderData.id, timestamp);
		await userRepository.addCoinBalance(recipient.id, GIFT_VALUE);
		await userRepository.addTotalCoinAmount(recipient.id, GIFT_VALUE);
		console.log(
			`${senderData.username} successfully sent 1 gift to ${
				recipient.username
			} at ${timestamp.toISOString()}.`
		);

		const transactionRepository = new TransactionRepository();
		await transactionRepository.create(senderData, recipient, GIFT_VALUE);

		return {
			statusCode: 200,
			message: "Gift successfully sent!",
		};
	}
}
