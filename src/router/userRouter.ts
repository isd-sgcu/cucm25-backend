import { UserController } from "@/controller/user/userController"
import { authMiddleware } from "@/middleware/authMiddleware"
import { UserRepository } from "@/repository/user/userRepository"
import { UserUsecase } from "@/usecase/user/userUsecase"
import { Router } from "express"

export default function userRouter() {
    const router = Router()
    const userRepository = new UserRepository()
    const userUsecase = new UserUsecase(userRepository)
    const userController = new UserController(userUsecase)

    router.post(
        "/onboarding",
        authMiddleware,
        userController.onboarding.bind(userController)
    )

    return router
}
