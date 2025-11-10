import { prisma } from "@/lib/prisma";
import { ParsedUser } from "@/types/user";
import { TransactionType } from "@prisma/client";

export class TransactionRepository {
	async create(
		sender: ParsedUser,
		recipient: ParsedUser,
		amount: number
	): Promise<void> {
		return await prisma.$transaction(async (tx) => {
			await tx.transaction.create({
				data: {
					sender_user_id: sender.id,
					recipient_user_id: recipient.id,
					type: TransactionType.GIFT,
					coin_amount: amount,
					exp_amount: amount,
				},
			});
		});
	}
}
