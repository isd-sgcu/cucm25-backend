import type { Request } from 'express';
import { AuthUser } from '../auth';

type GetRequestParams = unknown;

type ResponseBody = unknown;

type RequestBody = unknown;

type RequestQuery = unknown;

export interface GetTransactionRequest extends Request<
  GetRequestParams,
  ResponseBody,
  RequestBody,
  RequestQuery
> {
  user?: AuthUser;
}
