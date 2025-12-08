import { prisma } from "@/lib/prisma"
import type { OnboardingAnswers, ParsedUser } from "@/types/user"
import { Prisma, User } from "@prisma/client"
import type { LeaderboardUser } from "@/types/leaderboard"

export class UserRepository {
    async create(user: ParsedUser): Promise<void> {
        return await prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
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
                })
            }
        )
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

    async getLeaderboard(): Promise<Array<LeaderboardUser>> {
        let leaderboard = await prisma.user.findMany({
            where: {
                OR: [{ role: "PARTICIPANT" }, { role: "STAFF" }],
            },
            select: {
                nickname: true,
                role: true,
                firstname: true,
                lastname: true,
                educationLevel: true,
                wallets: {
                    select: {
                        cumulative_coin: true,
                    },
                },
            },
            orderBy: [
                {
                    wallets: {
                        cumulative_coin: "desc",
                    },
                },
                {
                    role: "asc", // PARTICIPANT before STAFF (from enum)
                },
                {
                    firstname: "asc",
                },
                {
                    lastname: "asc",
                },
            ],
        })

        return leaderboard.map((user) => {
            const { wallets, ...fields } = user

            return {
                ...fields,
                cumulative_coin: wallets?.cumulative_coin ?? 0,
            }
        })
    }
}
