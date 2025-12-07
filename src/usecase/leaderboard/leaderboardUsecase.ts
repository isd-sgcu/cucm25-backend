import { UserRepository } from "@/repository/user/userRepository"
import type { LeaderboardUser } from "@/types/leaderboard"

export class LeaderboardUsecase {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository
    }

    async getLeaderboard(): Promise<Array<LeaderboardUser>> {
        return await this.userRepository.getLeaderboard()
    }
}
