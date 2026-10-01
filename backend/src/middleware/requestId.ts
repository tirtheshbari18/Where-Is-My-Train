import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Request ID middleware that attaches a unique X-Request-ID to every incoming request
 * and measures response latency, logging structured railway access telemetry.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'];
  const requestId =
    typeof existingId === 'string' && existingId.trim() !== ''
      ? existingId.trim()
      : `req_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startHr = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHr);
    const durationMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

    // Only log API operations with structured railway tag
    if (req.path.startsWith('/api') || req.path === '/') {
      console.log(
        `[railway] requestId=${requestId} method=${req.method} path=${req.originalUrl} status=${res.statusCode} duration=${durationMs}ms`
      );
    }
  });

  next();
}
