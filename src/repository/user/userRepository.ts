import { prisma } from "@/lib/prisma"
import type { OnboardingAnswers, ParsedUser } from "@/types/user"
import { Prisma, User } from "@prisma/client"

export class UserRepository {
    async create(user: ParsedUser): Promise<void> {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.wallet.create({
                data: {
                    user_id: user.id,
                },
            })

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
        })
        if (!user) {
            return null
        }
        return user
    }

    async findExists(
        user: Pick<ParsedUser, "id" | "username">
    ): Promise<boolean> {
        const existingUser = await prisma.user.findFirst({
            where: {
                AND: [{ id: user.id }, { username: user.username }],
            },
        })
        if (existingUser) {
            return true
        }
        return false
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
            })

            await tx.user.update({
                where: {
                    id: id,
                },
                data: {
                    termsAcceptedAt: timestamp,
                    isResetUser: false,
                },
            })
        })
    }

    async resetUserAnswer(id: string) {
        await prisma.$transaction(async (tx) => {
            await tx.userAnswer.deleteMany({
                where: {
                    userId: id,
                },
            })

<<<<<<< HEAD
            await tx.user.update({
                where: {
                    id: id,
                },
                data: {
                    termsAcceptedAt: null,
                    isResetUser: true,
                },
            })
        })
    }
=======
	/**
	 * Adds to the total coin amount (which is named `current_level` since 1 `level` is 1 `coin`) to the user with `id`'s wallet
	 * `coin`s can be reduced, but `current_level` can't, so `current_level` acts as a total coin counter.
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
>>>>>>> 1a8321f (docs: clarified `current_level`'s purpose)
}
