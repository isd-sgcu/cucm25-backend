import { Router } from "express";
import authRouter from "@/router/authRouter";
import userRouter from "@/router/userRouter";

export default function routerManager() {
	const router = Router();

	router.use("/auth", authRouter());
	router.use("/user", userRouter());

	return router;
}
