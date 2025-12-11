import { EducationLevel, RoleType } from '@prisma/client';

export interface ParsedUser {
  id: string;
  studentId: string;
  username: string;
  nickname: string;
  firstname: string;
  lastname: string;
  role: RoleType;
  educationLevel: EducationLevel;
  school: string;
  wallets?: {
    coin_balance: number;
    gift_sends_remaining: number;
  };
  answers?: Array<{ questionId: string; answer: string }>;
}

export type OnboardingAnswers = Array<{
  questionId: string;
  optionText: string;
}>;
