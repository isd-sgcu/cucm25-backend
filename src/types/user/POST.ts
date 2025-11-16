export interface CreateOnboardingRequest {
    answers: Array<{
        questionId: string
        optionText: string
    }>
}
