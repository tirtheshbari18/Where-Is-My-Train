import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  retryable?: boolean;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const requestId = req.requestId || 'unknown';

  console.error(`[railway-error] requestId=${requestId} status=${statusCode} code=${err.code || 'INTERNAL_ERROR'}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const retryable =
    typeof err.retryable === 'boolean'
      ? err.retryable
      : statusCode >= 500 || statusCode === 429 || statusCode === 408;

  const userFriendlyMessage =
    statusCode < 500
      ? err.message
      : 'Live railway data service is temporarily unavailable. Please try again shortly.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode >= 500 ? 'PROVIDER_UNAVAILABLE' : 'INTERNAL_ERROR'),
      message: userFriendlyMessage,
      retryable,
      ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
    },
  });
}
