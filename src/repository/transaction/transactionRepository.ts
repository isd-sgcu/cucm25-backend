import { prisma } from "@/lib/prisma";
import { AppError } from "@/types/error/AppError";
import { ParsedUser } from "@/types/user";

export class TransactionRepository {
	async create(
		sender: ParsedUser,
		recipient: ParsedUser,
		amount: number
	): Promise<void> {
		return await prisma.$transaction(async (tx) => {
			await tx.transaction.create({
				data: {
					id: crypto.randomUUID(),
					sender_user_id: sender.id,
					sender_username: sender.username,
					recipient_user_id: recipient.id,
					recipient_username: recipient.username,
					amount: amount,
				},
			});
		});
	}
}
