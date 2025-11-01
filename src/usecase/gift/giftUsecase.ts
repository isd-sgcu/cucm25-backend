import { GiftRepository } from "@/repository/gift/giftRepository";
import { UserRepository } from "@/repository/mock/userRepository";
import { ParsedUser } from "@/types/user";

async function checkRecipientExistence(id: string | null) {
	if (!id) {
		console.warn("Recipient doesn't actually exist.");
		return false;
	}

	const userRepository = new UserRepository();
	const recipient = userRepository.getUserById(id);

	if (!recipient) {
		return false;
	}

	return true;
}

/* This function assumes sender already exists (this should've already been checked elsewhere.) */
function checkSenderLimit(sender: ParsedUser) {
	// TODO: Add timestamp checking to see if limit should be reset,
	// e.g. if the last time gift sent > 3600 then let it pass even if remaining is 0.

	if (sender.wallets.gift_sends_remaining <= 0) {
		console.warn("Sender ran out of gift sends in the time period.");
		return false;
	}
	return true;
}

function checkSenderBalance(sender: ParsedUser, amount: number) {
	if (sender.wallets.coin_balance < amount) {
		console.warn("Sender doesn't have enough currency.");
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
		sender: ParsedUser,
		recipientId: string,
		amount: number
	): Promise<{ statusCode: number; message: string }> {
		let ok = true;

		if (!checkRecipientExistence(recipientId)) {
			ok = false;
		}

		if (!checkSenderLimit(sender)) {
			ok = false;
		}

		if (!checkSenderBalance(sender, amount ?? 0)) {
			ok = false;
		}

		if (!ok) {
			return {
				statusCode: 400,
				message: "Unable to send gift.",
			};
		}

		/**
		 * Actually send the gift:
		 * - Deduct `amount` currency from `sender`'s wallet
		 * - Deduct 1 from the sender's quota
		 * - Add `amount` currency to `recipient`'s wallet.
		 * - TODO: Properly log the transaction (currently it's just a `console.log`) (possibly in `giftRepository.ts`?)
		 */

		const userRepository = new UserRepository();

		await userRepository.addCoinBalance(sender.id, amount * -1);
		await userRepository.addSendingQuota(sender.id, -1);
		await userRepository.addCoinBalance(recipientId, amount);
		console.log(
			`${sender.id} successfully sent ${amount} money to ${recipientId} at ${new Date().toISOString()}.`
		);

		return {
			statusCode: 200,
			message: "Gift successfully sent!",
		};
	}
}
