import { prisma } from '@/lib/prisma';
import type { OnboardingAnswers, ParsedUser } from '@/types/user';
import { Prisma, User } from '@prisma/client';
import type { LeaderboardUser } from '@/types/leaderboard';
import { LeaderboardFilter } from '@/types/leaderboard/index';
import { SYSTEM_DEFAULTS } from '@/constant/systemConfig';

export class UserRepository {
  async create(user: ParsedUser): Promise<void> {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.wallet.create({
        data: {
          user_id: user.id,
        },
      });

      await tx.user.create({
        data: {
          id: user.id,
          studentId: user.studentId,
          username: user.username,
          nickname: user.nickname,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          educationLevel: user.educationLevel,
          school: user.school,
        },
      });
    });
  }

  async getUser(
    input: Partial<Pick<User, 'id' | 'username'>>,
  ): Promise<
    | (User & {
        wallets: {
          coin_balance: number;
          cumulative_coin: number;
          gift_sends_remaining: number;
          gift_sends: number;
          last_gift_reset: Date | null;
        };
      })
    | null
  > {
    const giftHourlyQuota = await prisma.systemSetting.findUnique({
      where: { setting_key: 'gift_hourly_quota' },
    });

    const quota = parseInt(
      giftHourlyQuota?.setting_value || SYSTEM_DEFAULTS.GIFT_QUOTA.toString(),
    );

    let user = await prisma.user.findFirst({
      where: input,
      include: {
        wallets: {
          select: {
            coin_balance: true,
            cumulative_coin: true,
            last_gift_reset: true,
            gift_sends: true,
          },
        },
      },
    });
    if (!user) {
      return null;
    }

    const startOfCurrentHour = new Date();
    startOfCurrentHour.setMinutes(0, 0, 0);
    startOfCurrentHour.setHours(startOfCurrentHour.getHours()-1);

    if (
      !user.wallets.last_gift_reset ||
      user.wallets.last_gift_reset < startOfCurrentHour
    ) {
      console.log('Resetting gift sends for user:', user.id);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          wallets: {
            update: {
              gift_sends: 0,
              last_gift_reset: new Date(),
            },
          },
        },
        include: {
          wallets: {
            select: {
              coin_balance: true,
              cumulative_coin: true,
              last_gift_reset: true,
              gift_sends: true,
            },
          },
        },
      });
    }

    return {
      ...user,
      wallets: {
        coin_balance: user.wallets.coin_balance,
        cumulative_coin: user.wallets.cumulative_coin,
        gift_sends_remaining: (quota - user.wallets.gift_sends),
        gift_sends: user.wallets.gift_sends,
        last_gift_reset: user.wallets.last_gift_reset,
      },
    };
  }

  async findExists(
    user: Pick<ParsedUser, 'id' | 'username'>,
  ): Promise<boolean> {
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [{ id: user.id }, { username: user.username }],
      },
    });
    if (existingUser) {
      return true;
    }
    return false;
  }

  async createUserAnswer(
    id: string,
    body: OnboardingAnswers,
    timestamp: Date,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.userAnswer.createMany({
        data: body.map((answer) => ({
          userId: id,
          questionId: answer.questionId,
          answer: answer.optionText,
          answeredAt: timestamp,
        })),
      });

      await tx.user.update({
        where: {
          id: id,
        },
        data: {
          termsAcceptedAt: timestamp,
          isResetUser: false,
        },
      });
    });
  }

  async resetUserAnswer(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.userAnswer.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.user.update({
        where: {
          id: id,
        },
        data: {
          termsAcceptedAt: null,
          isResetUser: true,
        },
      });
    });
  }

  async getParsedUserById(id: string): Promise<ParsedUser | null> {

    const user = await this.getUser({ id });
    return user;
  }

  /**
   * Gets a user by username (at the moment it's the format of `{n,p}[0-9][0-9][0-9]`)
   * @param {string} username
   * @returns The user if one with `username` exists, `null` otherwise.
   */
  async getUserByUsername(username: string): Promise<ParsedUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
      include: {
        wallets: {
          select: {
            coin_balance: true,
            gift_sends: true,
          },
        },
        answers: {
          select: {
            questionId: true,
            answer: true,
          },
        },
      },
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async getLeaderboard(
    filter: LeaderboardFilter,
  ): Promise<Array<LeaderboardUser>> {
    let leaderboard = await prisma.user.findMany({
      where: {
        OR: filter.roles,
      },
      select: {
        nickname: true,
        role: true,
        firstname: true,
        lastname: true,
        educationLevel: true,
        wallets: {
          select: {
            cumulative_coin: true,
          },
        },
      },
      orderBy: [
        {
          wallets: {
            cumulative_coin: 'desc',
          },
        },
      ],
      take: filter.limit,
    });

    return leaderboard.map((user) => {
      const { wallets, ...fields } = user;

      return {
        ...fields,
        cumulative_coin: wallets?.cumulative_coin ?? 0,
      };
    });
  }
}
