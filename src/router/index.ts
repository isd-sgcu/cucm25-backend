import { Router } from "express"
import mockRouter from "@/router/mock"

export default function routerManager() {
    const router = Router()

    router.use("/mock", mockRouter())

    return router
}
