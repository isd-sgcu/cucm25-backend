import { Router } from "express"
import mockRouter from "@/router/mock"
import codeRouter from "@/router/code"
import systemRouter from "@/router/system"

export default function routerManager() {
    const router = Router()

    router.use("/mock", mockRouter())
    router.use("/code", codeRouter())
    router.use("/system", systemRouter())

    return router
}
