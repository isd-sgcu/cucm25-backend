import { Router } from "express";
import giftRouter from "@/router/giftRouter";
import authRouter from "@/router/authRouter";

export default function routerManager() {
	const router = Router();

	router.use("/gift", giftRouter());
	router.use("/auth", authRouter());

	return router;
}
