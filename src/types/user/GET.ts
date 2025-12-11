import type { Request } from 'express';
import { AuthUser } from '../auth';

export interface GetRequestParams {
  id?: string; // id from frontend (e.g., 'nXXX', 'pXXX') refer to `username` in the database
}

interface ResponseBody {}

interface RequestBody {}

interface RequestQuery {}

export interface GetUserRequest extends Request<
  GetRequestParams,
  ResponseBody,
  RequestBody,
  RequestQuery
> {
  user?: AuthUser;
}
