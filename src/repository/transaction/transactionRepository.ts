import { prisma } from "@/lib/prisma";
import { AppError } from "@/types/error/AppError";
import { ParsedUser } from "@/types/user";

export class TransactionRepository {
	// 1 exp is 1 current_level = 1 coin (they're the same)
	async create(
		sender: ParsedUser | null,
		recipient: ParsedUser | null,
		amount: number
	): Promise<void> {
		// to be fair this shouldn't even go in the branch
		// but its here so that the typescript compiler doesn't complain
		if (!sender || !recipient) {
			throw new AppError("Missing data on transaction record.", 500);
		}

		await prisma.transaction.create({
			data: {
				sender_user_id: sender.id,
				recipient_user_id: recipient.id,
				type: "GIFT",
				coin_amount: amount,
			},
		});
	}
}
