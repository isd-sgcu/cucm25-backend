import { Router } from "express";
import mockRouter from "@/router/mock";
import giftRouter from "./gift";

export default function routerManager() {
	const router = Router();

	router.use("/gift", giftRouter());
	router.use("/mock", mockRouter());

	return router;
}
