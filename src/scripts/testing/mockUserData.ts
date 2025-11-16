/**
 * NOTE: Due to the lack of the actual authentication for this project (as of November 1, 2025),
 * this file is used to create mock users instead to test gifting functionality.
 * TODO: Integrate the gifting functionality (this) with a proper authentication method once
 * it gets implemented/merged (maybe delete this file as well idk) -mistertfy64 2025-11-01
 *
 * TODO: This script requires the `wallets` table and the `users` table to be
 * manually created first.
 */

import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { EducationLevel, RoleType } from "@prisma/client";
require("@dotenvx/dotenvx").config();

const mockNames = [
	"Blocky",
	"Bubble",
	"Coiny",
	"Eraser",
	"Firey",
	"Flower",
	"GolfBall",
	"IceCube",
	"Leafy",
	"Match",
	"Needle",
	"Pen",
	"Pencil",
	"Pin",
	"Rocky",
	"Snowball",
	"Spongy",
	"Teardrop",
	"TennisBall",
	"Woody",
];

/**
 * Actually writes the mock users in.
 * @param {number} amount The amount of mock users to create.
 */
async function addMockUsers(amount: number) {
	for (let number = 0; number < amount; number++) {
		const user = createMockUserData();
		await prisma.$transaction(async (tx) => {
			await tx.wallet.create({
				data: {
					user_id: user.id,
				},
			});

			await tx.user.create({
				data: {
					id: user.id,
					studentId: user.studentId,
					username: user.username,
					nickname: user.nickname,
					firstname: user.firstname,
					lastname: user.lastname,
					role: user.role,
					educationLevel: user.educationLevel,
					school: user.school,
				},
			});
		});
	}
}

/**
 * Creates randomized fake data for a user.
 * @returns The fake data generated for the user.
 */
function createMockUserData() {
	const roll = Math.floor(Math.random() * 90000000) + 10000000;

	const firstName = mockNames[Math.floor(Math.random() * 20)] as string;

	const user = {
		id: randomUUID(),
		studentId: roll.toString(),
		username: `bfdi-contestant-${roll}`,
		nickname: `bfdi-contestant-${roll}`,
		firstname: firstName,
		lastname: (roll * 2).toString(),
		role: RoleType.PARTICIPANT,
		educationLevel: EducationLevel.Y1,
		school: `${firstName} Name Pronunciation School`,
	};

	return user;
}

addMockUsers(5);
