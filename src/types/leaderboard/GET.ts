import type { Request } from 'express';
import { AuthUser } from '../auth';

interface RequestParams {}

interface ResponseBody {}

interface RequestBody {}

export interface GetLeaderboardRequestQuery {
  role?: string;
  limit?: string;
}

export interface GetLeaderboardRequest extends Request<
  RequestParams,
  ResponseBody,
  RequestBody,
  GetLeaderboardRequestQuery
> {
  user?: AuthUser;
}
