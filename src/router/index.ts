import { Router } from "express"
import authRouter from "@/router/authRouter"
import codeRouter from "@/router/code"
import systemRouter from "@/router/system"
import userRouter from "@/router/userRouter"

export default function routerManager() {
    const router = Router()

    router.use("/auth", authRouter())
    router.use("/code", codeRouter())
    router.use("/system", systemRouter())
    router.use("/user", userRouter())

    return router
}
