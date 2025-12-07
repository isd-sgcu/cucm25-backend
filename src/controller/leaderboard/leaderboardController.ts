import { AuthenticatedRequest } from "@/types/auth/index"
import { AppError } from "@/types/error/AppError"
import { LeaderboardUsecase } from "@/usecase/leaderboard/leaderboardUsecase"
import type { Response } from "express"

export class LeaderboardController {
    private leaderboardUsecase: LeaderboardUsecase

    constructor(leaderboardUsecase: LeaderboardUsecase) {
        this.leaderboardUsecase = leaderboardUsecase
    }

    async get(_req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const leaderboard = await this.leaderboardUsecase.getLeaderboard()
            res.status(200).json({ leaderboard })
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
                return
            }
            console.error("Get leaderboard error:", error)
            res.status(500).json({
                message: "An unexpected error occurred",
            })
        }
    }
}
