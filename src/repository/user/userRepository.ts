import { prisma } from "@/lib/prisma";
import type { OnboardingAnswers, ParsedUser } from "@/types/user";
import { Prisma, User } from "@prisma/client";

export class UserRepository {
	async create(user: ParsedUser): Promise<void> {
		return await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
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
			}
		);
	}

	async getUser(
		input: Partial<Pick<User, "id" | "username">>
	): Promise<User | null> {
		const user = await prisma.user.findFirst({
			where: input,
			include: {
				wallets: {
					select: {
						coin_balance: true,
						cumulative_coin: true,
						gift_sends_remaining: true,
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

	async createUserAnswer(
		id: string,
		body: OnboardingAnswers,
		timestamp: Date
	): Promise<void> {
		await prisma.$transaction(async (tx) => {
			await tx.userAnswer.createMany({
				data: body.map((answer) => ({
					userId: id,
					questionId: answer.questionId,
					answer: answer.optionText,
					answeredAt: timestamp,
				})),
			});

			await tx.user.update({
				where: {
					id: id,
				},
				data: {
					termsAcceptedAt: timestamp,
					isResetUser: false,
				},
			});
		});
	}

	async resetUserAnswer(id: string) {
		await prisma.$transaction(async (tx) => {
			await tx.userAnswer.deleteMany({
				where: {
					userId: id,
				},
			});

			await tx.user.update({
				where: {
					id: id,
				},
				data: {
					termsAcceptedAt: null,
					isResetUser: true,
				},
			});
		});
	}
	/**
	 * Adds to the total coin amount (which is named `cumulative_coin` since 1 `level` is 1 `coin`) to the user with `id`'s wallet
	 * `coin`s can be reduced, but `cumulative_coin` can't, so `cumulative_coin` acts as a total coin counter.
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
							cumulative_coin: { increment: amount },
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

  async getParsedUserById(id: string): Promise<ParsedUser | null> {
		const user = await prisma.user.findFirst({
			where: {
				id: id,
			},
			include: {
				wallets: {
					select: {
						coin_balance: true,
						gift_sends_remaining: true,
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
						gift_sends_remaining: true,
					},
				},
			},
		});
		if (!user) {
			return null;
		}
		return user;
	}
}
