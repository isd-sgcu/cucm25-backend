import { prisma } from "@/lib/prisma"
import { EducationLevel, RoleType, User } from "@prisma/client"

export interface parsedUser {
    id: string
    studentId: string
    username: string
    nickname: string
    firstname: string
    lastname: string
    role: RoleType
    educationLevel?: EducationLevel
    school?: string
}

export class UserRepository {
    async create(user: parsedUser): Promise<User> {
        return await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    id: user.id,
                    studentId: user.studentId,
                    username: user.username,
                    nickname: user.nickname,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    role: user.role,
                    educationLevel: user.educationLevel || null,
                    school: user.school || null,
                },
            })

            return newUser
        })
    }

    async findExists(
        user: Pick<parsedUser, "id" | "username">
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
}
