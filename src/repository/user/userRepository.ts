import { prisma } from "@/lib/prisma"
import type { MappedOnboarding, ParsedUser } from "@/types/user"
import { User } from "@prisma/client"

export class UserRepository {
    async create(user: ParsedUser): Promise<void> {
        return await prisma.$transaction(async (tx) => {
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
        })
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

    async createUserAnswer(id: string, body: MappedOnboarding): Promise<void> {
        const timestamp = new Date()

        await prisma.$transaction(async (tx) => {
            await tx.userAnswer.createMany({
                data: body.map((answer) => ({
                    user_id: id,
                    question_id: answer.questionId,
                    selected_option_id: answer.optionId,
                    answered_at: timestamp,
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
}
