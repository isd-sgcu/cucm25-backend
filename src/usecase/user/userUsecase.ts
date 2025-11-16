import { UserRepository } from "@/repository/user/userRepository"
import { AuthUser } from "@/types/auth"
import { AppError } from "@/types/error/AppError"
import type { GetRequestParams } from "@/types/user/GET"
import type {
    CreateOnboardingRequest,
    ResetOnboardingRequest,
} from "@/types/user/POST"
import { RoleType, User } from "@prisma/client"

export class UserUsecase {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async getUser(
        authUser: AuthUser,
        params: GetRequestParams
    ): Promise<User | null> {
        this.validateGetUserRequest(authUser, params)

        return await this.userRepository.getUser({ username: params.id! })
    }

    async createOnboarding(
        authUser: AuthUser,
        body: CreateOnboardingRequest
    ): Promise<void> {
        await this.validateCreateOnboardingRequest(authUser, body)

        const timestamp = new Date()
        await this.userRepository.createUserAnswer(
            authUser.id,
            body.answers,
            timestamp
        )
    }

    async resetOnboarding(authUser: AuthUser, body: ResetOnboardingRequest) {
        const id = await this.validateResetOnboardingRequest(authUser, body)

        await this.userRepository.resetUserAnswer(id)
    }

    private validateGetUserRequest(
        authUser: AuthUser,
        params: GetRequestParams
    ): void {
        if (authUser.role !== RoleType.ADMIN) {
            throw new AppError("Insufficient Permissions", 403)
        }

        if (!params.id) {
            throw new AppError("Invalid get user request", 400)
        }
    }

    private async validateCreateOnboardingRequest(
        authUser: AuthUser,
        body: CreateOnboardingRequest
    ): Promise<void> {
        if (
            authUser.role !== RoleType.PARTICIPANT &&
            authUser.role !== RoleType.STAFF
        ) {
            throw new AppError(
                "Onboarding is not allowed for this user role",
                403
            )
        }

        if (!body.answers || body.answers.length === 0) {
            throw new AppError("Invalid onboarding request", 400)
        }

        for (const answer of body.answers) {
            if (!answer.questionId || !answer.optionText) {
                throw new AppError("Missing questionId or optionText", 400)
            }
        }

        const user = await this.userRepository.getUser({ id: authUser.id })

        if (!user) {
            throw new AppError("User does not exist", 404)
        }
        if (user.termsAcceptedAt !== null) {
            throw new AppError(
                `User already onboarding at ${user.termsAcceptedAt.toISOString()}`,
                400
            )
        }
    }

    private async validateResetOnboardingRequest(
        authUser: AuthUser,
        body: ResetOnboardingRequest
    ): Promise<string> {
        if (authUser.role !== RoleType.ADMIN) {
            throw new AppError("Insufficient Permissions", 403)
        }

        if (!body.id) {
            throw new AppError("Invalid reset user request", 400)
        }

        const user = await this.userRepository.getUser({ username: body.id })
        if (!user) {
            throw new AppError("User does not exist", 404)
        }

        if (
            user.role !== RoleType.PARTICIPANT &&
            user.role !== RoleType.STAFF
        ) {
            throw new AppError("Reset is not allowed for this user role", 403)
        }

        return user.id
    }
}
