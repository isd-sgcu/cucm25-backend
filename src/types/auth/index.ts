import { User } from '@prisma/client';
import type { Request } from 'express';

export type AuthUser = Pick<User, 'id' | 'username' | 'role'>;

export interface KeycloakUser {
  sub: string;
  groups?: Array<string>;
  studentId: string;
  nickName: string;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  education_level?: string;
  school?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
