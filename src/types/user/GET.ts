import type { Request } from 'express';
import { AuthUser } from '../auth';

export interface GetRequestParams {
  id?: string; // id from frontend (e.g., 'nXXX', 'pXXX') refer to `username` in the database
}

type ResponseBody = unknown;

type RequestBody = unknown;

type RequestQuery = unknown;

export interface GetUserRequest extends Request<
  GetRequestParams,
  ResponseBody,
  RequestBody,
  RequestQuery
> {
  user?: AuthUser;
}
