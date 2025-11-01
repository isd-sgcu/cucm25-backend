import { UserRepository } from "@/repository/mock/userRepository";
import { ParsedUser } from "@/types/user";
import { NextFunction, Request, Response } from "express";

/**
 * !!! DO NOT USE THIS FILE IN PRODUCTION !!!
 *
 * NOTE: Due to the lack of the actual authentication for this project (as of November 1, 2025),
 * this file is used to create simulate the middleware as if an authenticated user is using this.
 *
 * TODO: Integrate the gifting functionality (this) with a proper authentication method once
 * it gets implemented/merged (maybe delete this file as well idk) -mistertfy64 2025-11-01
 */

declare module "express" {
	interface Request {
		user?: ParsedUser;
	}
}

export function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		res.status(401).json({ message: "Unauthorized: Token not provided" });
		return;
	}

	const id = authHeader.split(" ")[1];
	if (!id) {
		res.status(401).json({ message: "Unauthorized: Token not provided" });
		return;
	}

	const userRepository = new UserRepository();
	userRepository.getUserById(id).then(function (user) {
		if (!user) {
			res.status(400).json({ message: "Bad Request: User not found." });
		}

		try {
			req.body.user = user;
			next();
		} catch (error) {
			console.log("JWT verification error:", error);
			res.status(401).json({ message: "Unauthorized: Invalid token" });
		}
	});
}
