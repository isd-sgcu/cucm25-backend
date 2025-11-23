import { prisma } from "@/lib/prisma";
import type { ParsedUser } from "@/types/user";
import { User } from "@prisma/client";

export class UserRepository {
	async create(user: ParsedUser): Promise<void> {
		return await prisma.$transaction(async (tx) => {
			await tx.wallet.create({
				data: {
					user_id: user.id,
				},
			});

			await tx.user.create({
				data: {
					id: user.id,
					studentId: user.studentId,
					username: user.username,
					nickname: user.nickname,
					firstname: user.firstname,
					lastname: user.lastname,
					role: user.role,
					educationLevel: user.educationLevel,
					school: user.school,
				},
			});
		});
	}

	async getUserById(id: string): Promise<User | null> {
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

	async getParsedUserById(id: string): Promise<ParsedUser | null> {
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
	 * Gets a user by username (at the moment it's the format of `{n,p}[0-9][0-9][0-9]`)
	 * @param {string} username
	 * @returns The user if one with `username` exists, `null` otherwise.
	 */
	async getUserByUsername(username: string): Promise<ParsedUser | null> {
		const user = await prisma.user.findFirst({
			where: {
				username: username,
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
						data: {
							coin_balance: { increment: amount },
						},
					},
				},
			},
		});
	}

	/**
	 * Adds to the total coin amount (which is named `current_level` since 1 `level` is 1 `coin`) to the user with `id`'s wallet
	 * @param {string} id The target user's id.
	 * @param {number} amount The amount to add. Negative numbers are allowed but should not be used unless for exceptional cases.
	 */
	async addTotalCoinAmount(id: string, amount: number) {
		await prisma.user.update({
			where: { id: id },
			data: {
				wallets: {
					update: {
						where: {
							user_id: id,
						},
						data: {
							current_level: { increment: amount },
						},
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
