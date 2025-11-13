import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/mock/userRepository";
import { TransactionRepository } from "@/repository/transaction/transactionRepository";
import { AuthUser } from "@/types/auth";
import { ParsedUser } from "@/types/user";

const SENDING_QUOTA = 7;
const RESET_TIME = 1000 * 60 * 60;

async function checkRecipientExistence(username: string | null) {
	if (!username) {
		console.warn("Recipient doesn't actually exist.");
		return false;
	}

	const userRepository = new UserRepository();
	// TODO: Unnecessary extra call just to check for existence.
	const recipient = userRepository.getUserByUsername(username);

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

	if (
		resetTime.getMilliseconds() !== 0 ||
		resetTime.getSeconds() !== 0 ||
		resetTime.getMinutes() !== 0
	) {
		resetTime.setHours(resetTime.getHours() + 1);
		resetTime.setMinutes(0);
		resetTime.setSeconds(0);
		resetTime.setMilliseconds(0);
	}

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
		recipientUsername: string,
		amount: number
	): Promise<{ statusCode: number; message: string; newAmount: number }> {
		let ok = true;

		const userRepository = new UserRepository();
		const senderData = await userRepository.getUserById(sender.id);

		if (!senderData?.wallets) {
			return {
				statusCode: 400,
				message: "Sender's wallet doesn't exist???",
				newAmount: 0,
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
				`Reset ${senderData.id}'s sending quota to ${SENDING_QUOTA}, as it has been more than ${RESET_TIME} milliseconds after the last gift sending.`
			);
		}

		if (!checkRecipientExistence(recipientUsername)) {
			ok = false;
		}

		if (!checkSenderLimit(senderData)) {
			ok = false;
		}

		if (!checkSenderBalance(senderData, amount ?? 0)) {
			ok = false;
		}

		if (!ok) {
			return {
				statusCode: 400,
				message: "Unable to send gift.",
				newAmount: senderData.wallets.coin_balance,
			};
		}

		const recipient = (await userRepository.getUserByUsername(
			recipientUsername
		)) as ParsedUser;

		/**
		 * Actually send the gift:
		 * - Deduct `amount` currency from `sender`'s wallet
		 * - Deduct 1 from the sender's quota
		 * - Set the timestamp of the last gift send to this time.
		 * - Add `amount` currency to `recipient`'s wallet.
		 * - Log the transaction. // TODO: the `timestamp` variable and the timestamp in the record may be different.
		 */

		const timestamp = new Date();
		await userRepository.addCoinBalance(senderData.id, amount * -1);
		await userRepository.addSendingQuota(senderData.id, -1);
		await userRepository.setLastSendTime(senderData.id, timestamp);
		await userRepository.addCoinBalance(recipient.id, amount);
		await userRepository.addTotalCoinAmount(recipient.id, amount);
		console.log(
			`${senderData.username} successfully sent ${amount} money to ${recipient.username} at ${timestamp.toISOString()}.`
		);

		const transactionRepository = new TransactionRepository();
		await transactionRepository.create(senderData, recipient, amount);

		return {
			statusCode: 200,
			message: "Gift successfully sent!",
			newAmount: senderData.wallets.coin_balance - amount,
		};
	}
}
