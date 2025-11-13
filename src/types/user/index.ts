import { EducationLevel, RoleType } from "@prisma/client"

export interface ParsedUser {
    id: string
    studentId: string
    username: string
    nickname: string
    firstname: string
    lastname: string
    role: RoleType
    educationLevel: EducationLevel
    school: string
}

export type MappedOnboarding = Array<{
    questionId: string
    optionId: number
}>
