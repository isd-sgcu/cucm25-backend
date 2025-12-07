import { LeaderboardController } from "@/controller/leaderboard/leaderboardController"
import { authMiddleware } from "@/middleware/authMiddleware"
import { UserRepository } from "@/repository/user/userRepository"
import { LeaderboardUsecase } from "@/usecase/leaderboard/leaderboardUsecase"
import { Router } from "express"

export default function leaderboardRouter() {
    const router = Router()
    const userRepository = new UserRepository()
    const leaderboardUsecase = new LeaderboardUsecase(userRepository)
    const leaderboardController = new LeaderboardController(leaderboardUsecase)

    router.get(
        "/",
        authMiddleware,
        leaderboardController.get.bind(leaderboardController)
    )

    return router
}
