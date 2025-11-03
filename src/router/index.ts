import { Router } from "express"
import authRouter from "@/router/authRouter"

export default function routerManager() {
    const router = Router()

    router.use("/auth", authRouter())

    return router
}
