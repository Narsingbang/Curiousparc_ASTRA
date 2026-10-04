import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId =
    req.id ||
    (req.headers['x-request-id'] as string) ||
    'req-unknown';

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
        request_id: requestId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Invalid request input data',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input data',
        details: err.flatten().fieldErrors,
        requestId,
        request_id: requestId,
      },
    });
    return;
  }

  if (err.name === 'SyntaxError' && 'body' in err) {
    res.status(400).json({
      message: 'Malformed JSON payload',
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload',
        requestId,
        request_id: requestId,
      },
    });
    return;
  }

  // Postgres / Supabase error mapping (codes 23505, 23503, 23514, 22P02, 42501, PGRST116)
  const pgCode = (err as any).code || (err as any)?.error?.code;
  if (typeof pgCode === 'string') {
    let status = 400;
    let mappedCode = 'DATABASE_ERROR';

    if (pgCode === '23505') {
      status = 409;
      mappedCode = 'CONFLICT';
    } else if (pgCode === '23503') {
      status = 400;
      mappedCode = 'FOREIGN_KEY_VIOLATION';
    } else if (pgCode === '23514') {
      status = 400;
      mappedCode = 'CHECK_VIOLATION';
    } else if (pgCode === '22P02') {
      status = 400;
      mappedCode = 'INVALID_INPUT_SYNTAX';
    } else if (pgCode === '42501') {
      status = 403;
      mappedCode = 'FORBIDDEN';
    } else if (pgCode === 'PGRST116') {
      status = 404;
      mappedCode = 'NOT_FOUND';
    }

    if (mappedCode !== 'DATABASE_ERROR') {
      logger.warn(
        {
          message: err.message,
          code: pgCode,
          details: (err as any).details || (err as any)?.error?.details,
          hint: (err as any).hint || (err as any)?.error?.hint,
          route: req.originalUrl || req.url,
          method: req.method,
          requestId,
        },
        'Mapped Supabase/Postgres error to HTTP response'
      );

      res.status(status).json({
        message: err.message || 'Database operation failed',
        error: {
          code: mappedCode,
          message: err.message || 'Database operation failed',
          requestId,
          request_id: requestId,
        },
      });
      return;
    }
  }

  // Unexpected Server Error (500)
  // Full detail logged with Pino. Patient data is NEVER logged.
  logger.error(
    {
      err: {
        message: err.message,
        code: (err as any).code,
        details: (err as any).details,
        hint: (err as any).hint,
        stack: err.stack,
      },
      method: req.method,
      path: req.originalUrl || req.url,
      requestId,
    },
    'unhandled error'
  );

  res.status(500).json({
    message: 'An unexpected internal error occurred',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred',
      requestId,
      request_id: requestId,
    },
    requestId,
    request_id: requestId,
  });
}
