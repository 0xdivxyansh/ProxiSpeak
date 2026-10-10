import { Response } from 'express';
import { ErrorCode } from '../errors/error-codes';

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: unknown[];
  };
  requestId?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  requestId?: string,
): Response {
  const payload: ApiResponseSuccess<T> = {
    success: true,
    data,
    requestId: requestId || (res.locals?.requestId as string | undefined),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  code: ErrorCode | string,
  message: string,
  statusCode = 500,
  details: unknown[] = [],
  requestId?: string,
): Response {
  const payload: ApiResponseError = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId: requestId || (res.locals?.requestId as string | undefined),
  };
  return res.status(statusCode).json(payload);
}
