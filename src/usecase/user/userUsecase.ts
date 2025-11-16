import { UserRepository } from "@/repository/user/userRepository"
import { AuthUser } from "@/types/auth"
import { AppError } from "@/types/error/AppError"
import type {
    CreateOnboardingRequest,
} from "@/types/user/POST"
import { RoleType } from "@prisma/client"

export class UserUsecase {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
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
}
