import { Router } from "express";
// import mockRouter from "@/router/mock";
import giftRouter from "./gift";
import authRouter from "@/router/authRouter";

export default function routerManager() {
	const router = Router();

	router.use("/gift", giftRouter());
	// router.use("/mock", mockRouter());
	router.use("/auth", authRouter());

	return router;
}
