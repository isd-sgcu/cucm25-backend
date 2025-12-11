import { Router } from "express"
import authRouter from "@/router/authRouter"
import codeRouter from "@/router/code"
import giftRouter from "@/router/giftRouter"
import systemRouter from "@/router/system"
import userRouter from "@/router/userRouter"
import leaderboardRouter from "@/router/leaderboardRouter"
import ticketRouter from "@/router/ticketRouter"

export default function routerManager() {
	const router = Router();

    router.use("/auth", authRouter())
    router.use("/code", codeRouter())
    router.use("/system", systemRouter())
    router.use("/user", userRouter())
    router.use("/leaderboard", leaderboardRouter())
    router.use("/ticket", ticketRouter())
    router.use("/gift",giftRouter());

	return router;
}
