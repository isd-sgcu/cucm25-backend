import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/user/userRepository";
import { TransactionRepository } from "@/repository/transaction/transactionRepository";
import { AuthUser } from "@/types/auth";
import { ParsedUser } from "@/types/user";

const SENDING_QUOTA = 7;
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

	if (sender?.wallets.gift_sends_remaining <= 0) {
		console.warn("Sender ran out of gift sends in the time period.");
		return false;
	}
	return true;
}

/* This function assumes sender's wallet already exists (this should've already been checked elsewhere.) */
function checkSenderBalance(sender: ParsedUser, amount: number) {
	if (!sender.wallets) {
		return false;
	}

	if (sender?.wallets.coin_balance < amount) {
		console.warn("Sender doesn't have enough currency.");
		return false;
	}
	return true;
}

function checkSenderResetTime(sender: ParsedUser) {
	if (!sender.wallets) {
		return false;
	}

	const resetTime = new Date(sender?.wallets.last_gift_sent_at);

	resetTime.setHours(resetTime.getHours() + 1);
	resetTime.setMinutes(0);
	resetTime.setSeconds(0);
	resetTime.setMilliseconds(0);

	const now = new Date().getTime();
	return now >= resetTime.getTime();
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

		if (!senderData?.wallets) {
			return {
				statusCode: 400,
				message: "Sender's wallet doesn't exist???",
			};
		}

		if (checkSenderResetTime(senderData)) {
			const remaining = senderData.wallets.gift_sends_remaining;

			// in the database
			await userRepository.addSendingQuota(
				senderData.id,
				SENDING_QUOTA - remaining
			);

			// in the current object
			senderData.wallets.gift_sends_remaining +=
				SENDING_QUOTA - remaining;

			console.log(
				`Reset ${senderData.id}'s sending quota to ${SENDING_QUOTA}, as it has been more than 3600000 milliseconds after the last gift sending.`
			);
		}

		if (sender.username === recipientUsername) {
			console.warn(
				`Unable to send gift for ${sender.username}: Sender and recipient are the same person.`
			);
			ok = false;
		}

		if (!(await checkRecipientExistence(recipientUsername))) {
			console.warn(
				`Unable to send gift for ${sender.username}: Recipient ${recipientUsername} doesn't exist.`
			);
			ok = false;
		}

		if (!checkSenderLimit(senderData)) {
			console.warn(
				`Unable to send gift for ${sender.username}: Sender ran out of gift quotas.`
			);
			ok = false;
		}

		if (!ok) {
			return {
				statusCode: 400,
				message: "Unable to send gift.",
			};
		}

		const recipient = (await userRepository.getUserByUsername(
			recipientUsername
		)) as ParsedUser;

		/**
		 * Actually send the gift:
		 * - Deduct 1 from the sender's quota
		 * - Set the timestamp of the last gift send to this time.
		 * - Add 100 currency to `recipient`'s wallet.
		 * - Log the transaction. // TODO: the `timestamp` variable and the timestamp in the record may be different.
		 */

		const timestamp = new Date();
		await userRepository.addSendingQuota(senderData.id, -1);
		await userRepository.setLastSendTime(senderData.id, timestamp);
		await userRepository.addCoinBalance(recipient.id, GIFT_VALUE);
		await userRepository.addTotalCoinAmount(recipient.id, GIFT_VALUE);
		console.log(
			`${senderData.username} successfully sent 1 gift to ${recipient.username} at ${timestamp.toISOString()}.`
		);

		const transactionRepository = new TransactionRepository();
		await transactionRepository.create(senderData, recipient, GIFT_VALUE);

		return {
			statusCode: 200,
			message: "Gift successfully sent!",
		};
	}
}
