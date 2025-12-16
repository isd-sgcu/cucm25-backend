import { verifyJwt } from '@/utils/jwt';
import { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '@/types/auth';
import { SystemRepository } from '@/repository/system';
import { SystemUsecase } from '@/usecase/system';

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}

const systemRepository = new SystemRepository();
const systemUsecase = new SystemUsecase(systemRepository);

export function authMiddleware(
  skipCheck?: boolean,
  options?: { allowedRoles?: string[] },
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: Token not provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Unauthorized: Token not provided' });
      return;
    }

    try {
      const decoded = verifyJwt(token);
      req.user = decoded;

      if (!skipCheck) {
        const isAvailable = await systemUsecase.checkSystemAvailability(
          decoded.role,
        );

        if (!isAvailable) {
          res.status(503).json({
            error: `Service Unavailable: System is currently disabled for your role (${decoded.role})`,
            systemStatus: 'disabled',
          });
          return;
        }
      }

      if (
        options?.allowedRoles?.length &&
        !options.allowedRoles.includes(decoded.role)
      ) {
        res.status(403).json({ message: 'Forbidden: Role not allowed' });
        return;
      }

      next();
    } catch (error) {
      console.log('JWT verification error:', error);
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  };
}
