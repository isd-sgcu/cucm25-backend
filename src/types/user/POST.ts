export interface OnboardingRequest {
    answers: Array<{
        questionId: number
        optionText: string
    }>
}
