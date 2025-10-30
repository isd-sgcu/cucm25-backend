import { CodeController } from "@/controller/code/codeController"
import { CodeRepository } from "@/repository/code/codeRepository"
import { CodeUsecase } from "@/usecase/code/codeUsecase"
import { Router } from "express"

export default function codeRouter() {
    const router = Router()
    const codeRepository = new CodeRepository()
    const codeUsecase = new CodeUsecase(codeRepository)
    const codeController = new CodeController(codeUsecase)

    // POST /api/code/generate
    router.post("/generate", codeController.generateCode.bind(codeController))

    // POST /api/code/redeem
    router.post("/redeem", codeController.redeemCode.bind(codeController))

    return router
}
