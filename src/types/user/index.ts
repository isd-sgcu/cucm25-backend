<<<<<<< HEAD
import { EducationLevel, RoleType } from "@prisma/client"
=======
/**
 * NOTE: Due to the lack of the actual authentication for this project (as of November 1, 2025),
 * this file is used to create the type of mock users instead to test gifting functionality.
 * TODO: Integrate the gifting functionality (this) with a proper authentication method once
 * it gets implemented/merged (maybe delete this file as well idk) -mistertfy64 2025-11-01
 */

import { EducationLevel, RoleType, User } from "@prisma/client";
>>>>>>> 8ee5245 (chore: add ANOTHER note saying that this is just a mock user)

export interface ParsedUser {
    id: string
    studentId: string
    username: string
    nickname: string
    firstname: string
    lastname: string
    role: RoleType
    educationLevel: EducationLevel
    school: string
}

export type OnboardingAnswers = Array<{
    questionId: string
    optionText: string
}>
