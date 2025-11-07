import { EducationLevel, RoleType, User } from "@prisma/client";

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
		current_level: number;
		gift_sends_remaining: number;
		last_gift_sent_at: Date;
	};
}
