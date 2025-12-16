import type { Request } from 'express';
import { AuthUser } from '../auth';

type RequestParams = unknown;

type ResponseBody = unknown;

type RequestBody = unknown;
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
