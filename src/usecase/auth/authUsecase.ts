import { getKeycloakToken } from "@/lib/api"
import { parsedUser, UserRepository } from "@/repository/user/userRepository"
import { LoginRequest } from "@/types/auth/POST"
import { AppError } from "@/types/error/AppError"
import { decodeKeycloakJwt, KeycloakUser, signJwt } from "@/utils/jwt"
import { RoleType } from "@prisma/client"

export class AuthUsecase {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async register(user: parsedUser): Promise<void> {
        const existingUser = await this.userRepository.findExists(user)
        if (!existingUser) {
            await this.userRepository.create(user)
        }
    }

    async login(
        body: Pick<parsedUser, "id" | "username" | "role">
    ): Promise<string> {
        return signJwt({
            id: body.id,
            username: body.username,
            role: body.role,
        })
    }

    async getKeycloakUser(body: LoginRequest): Promise<KeycloakUser> {
        this.validateLoginRequest(body)

        try {
            const keycloakToken = await getKeycloakToken(body)
            const keycloakUser = decodeKeycloakJwt(keycloakToken)

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

    parseKeycloakUser(user: KeycloakUser): parsedUser {
        let role: RoleType = RoleType.PARTICIPANT
        if (user.groups.includes("coreTeam")) {
            role = RoleType.CORETEAM
        } else if (user.groups.includes("staff")) {
            role = RoleType.MODERATOR
        }

        return {
            id: user.sub,
            studentId: user.studentId,
            username: user.preferred_username,
            nickname: user.nickName,
            firstname: user.given_name,
            lastname: user.family_name,
            role,
            // educationLevel: "?",
            // school: "?",
        }
    }

    private validateLoginRequest(body: LoginRequest): void {
        if (!body.username || !body.password) {
            throw new AppError("Invalid login request", 400)
        }
    }
}
