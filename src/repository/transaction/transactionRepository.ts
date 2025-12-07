import { prisma } from "@/lib/prisma";
import { ParsedUser } from "@/types/user";

export class TransactionRepository {
	// 1 exp is 1 current_level = 1 coin (they're the same)
	async create(
		sender: ParsedUser,
		recipient: ParsedUser,
		amount: number
	): Promise<void> {
		await prisma.$transaction(async (tx) => {
			await tx.transaction.create({
				data: {
					sender_user_id: sender.id,
					recipient_user_id: recipient.id,
					type: "GIFT",
					coin_amount: amount,
				},
			});
		});
	}
}
