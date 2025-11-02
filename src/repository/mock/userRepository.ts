import { prisma } from "@/lib/prisma";
import type { ParsedUser } from "@/types/user";

/*
 * NOTE: Due to the lack of the actual authentication for this project (as of November 1, 2025),
 * this file is used to create simulate the operation of finding a user in the database.
 *
 * TODO: Integrate the gifting functionality (this) with a proper authentication method once
 * it gets implemented/merged (maybe delete this file as well idk) -mistertfy64 2025-11-01
 */

export class UserRepository {
	// async create(user: ParsedUser): Promise<void> {
	// 	return await prisma.$transaction(async (tx) => {
	// 		await tx.wallet.create({
	// 			data: {
	// 				user_id: user.id,
	// 			},
	// 		});

	// 		await tx.user.create({
	// 			data: {
	// 				id: user.id,
	// 				studentId: user.studentId,
	// 				username: user.username,
	// 				nickname: user.nickname,
	// 				firstname: user.firstname,
	// 				lastname: user.lastname,
	// 				role: user.role,
	// 				educationLevel: user.educationLevel,
	// 				school: user.school,
	// 			},
	// 		});
	// 	});
	// }

	// FIXME: This uses a DIFFERENT USER TYPE from the one in @chawinkn's branch!!!!
	async getUserById(id: string): Promise<ParsedUser | null> {
		const user = await prisma.user.findFirst({
			where: {
				id: id,
			},
			include: {
				wallets: {
					select: {
						coin_balance: true,
						current_level: true,
						gift_sends_remaining: true,
						last_gift_sent_at: true,
					},
				},
			},
		});
		if (!user) {
			return null;
		}
		return user;
	}

	async findExists(
		user: Pick<ParsedUser, "id" | "username">
	): Promise<boolean> {
		const existingUser = await prisma.user.findFirst({
			where: {
				AND: [{ id: user.id }, { username: user.username }],
			},
		});
		if (existingUser) {
			return true;
		}
		return false;
	}

	/**
	 * Adds coin balance to user with `id`'s wallet.
	 * @param {string} id The target user's id.
	 * @param {number} amount The amount to add. Negative numbers (to represent subtracting) are allowed as well.
	 */
	async addCoinBalance(id: string, amount: number) {
		await prisma.user.update({
			where: { id: id },
			data: {
				wallets: {
					update: {
						where: {
							user_id: id,
						},
						data: { coin_balance: { increment: amount } },
					},
				},
			},
		});
	}

	/**
	 * Adds sending quota to user with `id`'s wallet.
	 * @param {string} id The target user's id.
	 * @param {number} amount The amount to add. Negative numbers (to represent subtracting) are allowed as well.
	 */
	async addSendingQuota(id: string, amount: number) {
		await prisma.user.update({
			where: { id: id },
			data: {
				wallets: {
					update: {
						where: {
							user_id: id,
						},
						data: { gift_sends_remaining: { increment: amount } },
					},
				},
			},
		});
	}

	/**
	 * Sets the last send time for a user's wallet.
	 * Used for enforcing the hourly limit of gift sending.
	 * @param {string} id The target user's id.
	 * @param {Date} timestamp The timestamp to set as the last send time.
	 */
	async setLastSendTime(id: string, timestamp: Date) {
		await prisma.user.update({
			where: { id: id },
			data: {
				wallets: {
					update: {
						where: {
							user_id: id,
						},
						data: { last_gift_sent_at: timestamp },
					},
				},
			},
		});
	}
}
