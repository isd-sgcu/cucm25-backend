import { EducationLevel, RoleType } from "@prisma/client"

export interface LeaderboardUser {
    nickname: string
    role: RoleType
    firstname: string
    lastname: string
    educationLevel: EducationLevel
    cumulative_coin: number
}

export interface LeaderboardFilter {
    roles: Array<{
        role: RoleType
    }>
    limit: number
}
