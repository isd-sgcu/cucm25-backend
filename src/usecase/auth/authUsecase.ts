import { UserRepository } from "@/repository/user/userRepository"
import { ParsedUser } from "@/types/user/index"
import { getKeycloakToken } from "@/lib/api"
import { verifyKeycloakJwt, signJwt } from "@/utils/jwt"

import type { LoginRequest } from "@/types/auth/POST"
import { AppError } from "@/types/error/AppError"
import { EducationLevel, RoleType, User } from "@prisma/client"
import type { AuthUser, KeycloakUser } from "@/types/auth"
import { N_MAPPING, P_MAPPING } from "@/constant/educationLevel"

export class AuthUsecase {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    // Init user if not exist and login
    async initAndLogin(user: ParsedUser): Promise<string> {
        const existingUser = await this.userRepository.findExists(user)
        if (!existingUser) {
            await this.userRepository.create(user)
        }

        return signJwt({
            id: user.id,
            username: user.username,
            role: user.role,
        })
    }

    async getUser(authUser: AuthUser): Promise<User | null> {
        return await this.userRepository.getUser({
            id: authUser.id,
            username: authUser.username,
        })
    }

    async getKeycloakUser(body: LoginRequest): Promise<KeycloakUser> {
        this.validateLoginRequest(body)

        try {
            const keycloakToken = await getKeycloakToken(body)
            const keycloakUser = verifyKeycloakJwt(keycloakToken)

            return keycloakUser
        } catch (error) {
            if (
                error instanceof AppError &&
                error.message === "invalid_grant" &&
                error.statusCode === 401
            ) {
                throw new AppError("Invalid username or password", 401)
            }
            throw error
        }
    }

    parseKeycloakUser(user: KeycloakUser): ParsedUser {
        let role = this.getRoleType(user.groups)
        let educationLevel = this.getEducationLevel(role, user.education_level)

        return {
            id: user.sub,
            studentId: user.studentId,
            username: user.preferred_username,
            nickname: user.nickName,
            firstname: user.given_name,
            lastname: user.family_name,
            role,
            educationLevel,
            school: user.school ?? "-",
        }
    }

    private validateLoginRequest(body: LoginRequest): void {
        if (!body.username || !body.password) {
            throw new AppError("Invalid login request", 400)
        }
    }

    private getRoleType(groups: Array<string> | undefined): RoleType {
        // undefined or empty array from Keycloak
        if (!groups || groups.length === 0) {
            return RoleType.PARTICIPANT
        }

        if (groups.includes("cucmAdmin")) {
            return RoleType.ADMIN
        }
        if (groups.includes("cucmModerator")) {
            return RoleType.MODERATOR
        }
        if (groups.includes("staff")) {
            return RoleType.STAFF
        }

        return RoleType.PARTICIPANT
    }

    private getEducationLevel(
        role: RoleType,
        education_level: string | undefined
    ): EducationLevel {
        // undefined or empty string from Keycloak
        if (!education_level) {
            return EducationLevel.GRADUATED
        }

        if (role === RoleType.PARTICIPANT) {
            return N_MAPPING[education_level] ?? EducationLevel.GRADUATED
        }

        return P_MAPPING[education_level] ?? EducationLevel.GRADUATED
    }
}
