import crypto from 'crypto';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimit';
import { ApiError } from './lib/errors';

export function createApp(): Express {
  const app = express();

  // Attach unique Request ID to every request and response header
  app.use((req, res, next) => {
    const incoming =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string);
    const reqId = incoming || crypto.randomUUID();
    req.id = reqId;
    res.setHeader('X-Request-Id', reqId);
    next();
  });

  // Trust first proxy for correct client IP detection on Vercel / reverse proxies
  app.set('trust proxy', 1);

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", env.SUPABASE_URL, 'wss://*.supabase.co'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS allow-list
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        try {
          const parsedUrl = new URL(origin);
          if (
            parsedUrl.hostname.endsWith('.vercel.app') ||
            parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1'
          ) {
            return callback(null, true);
          }
        } catch {
          // ignore parsing error
        }
        return callback(new ApiError(403, 'Blocked by CORS policy', 'CORS_ERROR'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '100kb' }));

  // Global rate limiter
  app.use(globalLimiter);

  // API Routes mounted on /api
  app.use('/api', apiRouter);

  // 404 for unknown /api routes
  app.use('/api/*', (_req, _res, next) => {
    next(ApiError.notFound('API endpoint not found'));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
