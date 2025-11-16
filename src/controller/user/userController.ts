import { AuthenticatedRequest } from "@/types/auth/index"
import { AppError } from "@/types/error/AppError"
import type { GetUserRequest } from "@/types/user/GET"
import { UserUsecase } from "@/usecase/user/userUsecase"
import type { Response } from "express"

export class UserController {
    private userUsecase: UserUsecase

    constructor(userUsecase: UserUsecase) {
        this.userUsecase = userUsecase
    }

    async get(req: GetUserRequest, res: Response): Promise<void> {
        try {
            const user = await this.userUsecase.getUser(req.user!, req.params)
            res.status(200).json({ user })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Get user error:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }

    async onboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            await this.userUsecase.createOnboarding(req.user!, req.body)
            res.status(200).json({ message: "Create onboarding successfully" })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Create onboarding error:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }

    async reset(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            await this.userUsecase.resetOnboarding(req.user!, req.body)
            res.status(200).json({ message: "Reset user successfully" })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Reset user error:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }
}
