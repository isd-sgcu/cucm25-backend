import { UserRepository } from '@/repository/user/userRepository';
import { AppError } from '@/types/error/AppError';
import type { LeaderboardFilter, LeaderboardUser } from '@/types/leaderboard';
import { GetLeaderboardRequestQuery } from '@/types/leaderboard/GET';
import { RoleType } from '@prisma/client';

export class LeaderboardUsecase {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getLeaderboard(
    query: GetLeaderboardRequestQuery,
  ): Promise<Array<LeaderboardUser>> {
    const filter = this.validateGetLeaderboardRequest(query);

    return await this.userRepository.getLeaderboard(filter);
  }

  private validateGetLeaderboardRequest(
    query: GetLeaderboardRequestQuery,
  ): LeaderboardFilter {
    const limits = [3, 30];
    const limit = Number(query.limit || '3');
    if (!limits.includes(limit)) {
      throw new AppError('Limit query param does not exist', 400);
    }

    let role = query.role?.toLowerCase() || 'all';
    let roles = [];
    if (role === 'all') {
      roles = [{ role: RoleType.PARTICIPANT }, { role: RoleType.STAFF }];
    } else if (role === 'participant') {
      roles = [{ role: RoleType.PARTICIPANT }];
    } else if (role === 'staff') {
      roles = [{ role: RoleType.STAFF }];
    } else {
      throw new AppError('Role query param does not exist', 400);
    }

    return { roles, limit };
  }
}
