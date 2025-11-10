import { QuestionRepository } from "@/repository/question/questionRepository"
import { UserRepository } from "@/repository/user/userRepository"
import { AuthUser } from "@/types/auth"
import { AppError } from "@/types/error/AppError"
import { MappedOnboarding } from "@/types/user"
import { OnboardingRequest } from "@/types/user/POST"
import { RoleType } from "@prisma/client"

export class UserUsecase {
    private userRepository: UserRepository
    private questionRepository: QuestionRepository

    constructor(
        userRepository: UserRepository,
        questionRepository: QuestionRepository
    ) {
        this.userRepository = userRepository
        this.questionRepository = questionRepository
    }

    async createOnboarding(
        authUser: AuthUser,
        body: OnboardingRequest
    ): Promise<void> {
        const user = await this.userRepository.getUserById(authUser.id)
        if (!user) {
            throw new AppError("User does not exist", 404)
        }
        if (user.termsAcceptedAt !== null) {
            throw new AppError("User already onboarding", 400)
        }

        // After this validation: body.answers will cover all requiredQuestions
        await this.validateOnboardingRequest(authUser.role, body)

        const mappedOnboarding = await this.mapOnboardingRequest(body)

        await this.userRepository.createUserAnswer(
            authUser.id,
            mappedOnboarding
        )
    }

    private async mapOnboardingRequest(
        body: OnboardingRequest
    ): Promise<MappedOnboarding> {
        return Promise.all(
            body.answers.map(async ({ questionId, optionText }) => {
                const questionOptionId =
                    await this.questionRepository.getQuestionOptionId(
                        questionId,
                        optionText
                    )
                if (!questionOptionId) {
                    throw new AppError("Invalid optionText", 400)
                }

                return {
                    questionId: questionId,
                    optionId: questionOptionId,
                }
            })
        )

        /*
        Batch
    
        const questionOptions =
            await this.questionRepository.getQuestionOptionIds(body.answers)

        if (body.answers.length !== questionOptions.length) {
            throw new AppError("Invalid optionText", 400)
        }
        const optionsMap = new Map(
            questionOptions.map((o) => [
                `${o.questionId}-${o.optionText}`,
                o.id,
            ])
        )

        return body.answers.map((question) => ({
            questionId: question.questionId,
            optionId: optionsMap.get(
                `${question.questionId}-${question.optionText}`
            )!,
        }))
        */
    }

    private async validateOnboardingRequest(
        role: RoleType,
        body: OnboardingRequest
    ): Promise<void> {
        const questionsId =
            await this.questionRepository.getAllQuestionsId(role)

        if (!body.answers || body.answers.length === 0) {
            throw new AppError("Invalid onboarding request", 400)
        }

        if (body.answers.length !== questionsId.length) {
            throw new AppError("Invalid number of answers", 400)
        }

        const requiredQuestions = new Set<number>(questionsId)
        const bodyQuestions = new Set<number>()

        for (const answer of body.answers) {
            const questionId = answer.questionId

            if (bodyQuestions.has(questionId)) {
                throw new AppError("Duplicate questionId", 400)
            }
            bodyQuestions.add(questionId)

            if (!requiredQuestions.has(questionId)) {
                throw new AppError("Invalid questionId", 400)
            }
        }
    }
}
