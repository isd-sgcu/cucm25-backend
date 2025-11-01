import { EducationLevel, RoleType } from "@prisma/client"

export interface ParsedUser {
<<<<<<< HEAD
    id: string
    studentId: string
    username: string
    nickname: string
    firstname: string
    lastname: string
    role: RoleType
    educationLevel: EducationLevel
    school: string
=======
	id: string;
	studentId: string;
	username: string;
	nickname: string;
	firstname: string;
	lastname: string;
	role: RoleType;
	educationLevel: EducationLevel;
	school: string;
	wallets: {
		coin_balance: number;
		current_level: number;
		gift_sends_remaining: number;
	};
>>>>>>> 4ea5318 (fix: add `wallets` to mock user)
}

export type OnboardingAnswers = Array<{
    questionId: string
    optionText: string
}>
