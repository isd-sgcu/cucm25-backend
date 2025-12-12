import type { Request } from 'express';
import { AuthUser } from '../auth';

export interface GetRequestParams {}

interface ResponseBody {}

interface RequestBody {}

interface RequestQuery {}

export interface GetTransactionRequest extends Request<
  GetRequestParams,
  ResponseBody,
  RequestBody,
  RequestQuery
> {
  user?: AuthUser;
}
