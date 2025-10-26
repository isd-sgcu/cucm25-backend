import { AppError } from "@/types/error/AppError"
import { AuthUsecase } from "@/usecase/auth/authUsecase"
import type { Request, Response } from "express"

export class AuthController {
    private authUsecase: AuthUsecase

    constructor(authUsecase: AuthUsecase) {
        this.authUsecase = authUsecase
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const keycloakUser = await this.authUsecase.getKeycloakUser(
                req.body
            )
            const user = this.authUsecase.parseKeycloakUser(keycloakUser)
            await this.authUsecase.register(user)

            const token = await this.authUsecase.login(user)
            res.cookie("token", token, {
                maxAge: 3 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV != "development"
            })
            res.status(200).json({ token })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Login error:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }
}
