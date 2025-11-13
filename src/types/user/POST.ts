export interface OnboardingRequest {
    answers: Array<{
        questionId: string
        optionText: string
    }>
}
