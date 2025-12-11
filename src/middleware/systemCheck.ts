import { Request, Response, NextFunction } from 'express';
import { SystemRepository } from '@/repository/system/systemRepository';
import { SystemUsecase } from '@/usecase/system/systemUsecase';
import { verifyJwt } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { ROLE_MAPPINGS } from '@/constant/systemConfig';
import { prisma } from '@/lib/prisma';

const systemRepository = new SystemRepository(prisma);
const systemUsecase = new SystemUsecase(systemRepository);

export async function checkSystemAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Skip check for system endpoints themselves and auth endpoints
    if (req.path.startsWith('/system') || req.path.startsWith('/auth')) {
      next();
      return;
    }

    let userRole: string | undefined;

    // Try to get user from JWT token (if authenticated)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = verifyJwt(token);
          const user = await systemRepository.getUserWithRole(decoded.id);
          if (user) {
            // Map RoleType enum to string for system check using shared config
            userRole =
              ROLE_MAPPINGS[user.role as keyof typeof ROLE_MAPPINGS] ||
              ROLE_MAPPINGS.PARTICIPANT;
            logger.debug('SystemCheck', 'User role mapped', {
              originalRole: user.role,
              mappedRole: userRole,
            });
          }
        } catch (jwtError) {
          // Invalid token, continue without user role
          logger.debug('SystemCheck', 'JWT verification failed', {
            error: String(jwtError),
          });
        }
      }
    }

    // Check system availability based on user role
    const isAvailable = await systemUsecase.checkSystemAvailability(userRole);

    logger.debug('SystemCheck', 'Availability check result', {
      userRole,
      isAvailable,
    });

    if (!isAvailable) {
      let roleMessage: string;
      if (userRole === 'junior') {
        roleMessage = 'participants';
      } else if (userRole === 'moderator') {
        roleMessage = 'moderators';
      } else if (userRole === 'senior') {
        roleMessage = 'staff members';
      } else if (userRole) {
        roleMessage = `users with role (${userRole})`;
      } else {
        roleMessage = 'unidentified users';
      }

      logger.warn('SystemCheck', 'System access blocked for role', {
        userRole,
      });
      res.status(503).json({
        error: `System for ${roleMessage} is temporarily disabled. Please try again later.`,
        systemStatus: 'disabled',
        userRole: userRole || 'unknown',
      });
      return;
    }
    next();
  } catch (error) {
    logger.error('SystemCheck', 'System availability check failed', error);
    // On error, block the request (fail-closed) for security
    res.status(503).json({
      error:
        'Unable to verify system availability at this time. Please try again later.',
      systemStatus: 'unknown',
    });
    return;
  }
}
