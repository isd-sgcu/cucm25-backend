import { AuthController } from "@/controller/auth/authController"
import { UserRepository } from "@/repository/user/userRepository"
import { AuthUsecase } from "@/usecase/auth/authUsecase"
import { Router } from "express"

export default function authRouter() {
    const router = Router()
    const userRepository = new UserRepository()
    const authUsecase = new AuthUsecase(userRepository)
    const authController = new AuthController(authUsecase)

    router.post("/login", authController.login.bind(authController))

    return router
}
