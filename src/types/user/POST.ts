export interface CreateOnboardingRequest {
    answers: Array<{
        questionId: string
        optionText: string
    }>
}

export interface ResetOnboardingReqeust {
    id: string // id from frontend (e.g., 'nXXX', 'pXXX') refer to `username` in the database
}
