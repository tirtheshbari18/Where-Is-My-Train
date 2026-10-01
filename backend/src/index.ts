import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible frontend development and maps
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      // In development allow any localhost
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin === CLIENT_URL
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for API consumers
    },
    credentials: true,
  })
);

// Attach unique X-Request-ID and structured railway access telemetry
app.use(requestIdMiddleware);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting on API
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api', apiRouter);

// Fallback mount for environments where /api is stripped by serverless rewrites
app.use((req, res, next) => {
  if (req.path !== '/' && !req.path.startsWith('/api')) {
    return apiRouter(req, res, next);
  }
  next();
});


// Root Welcome Endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'WHERE IS MY TRAIN - Indian Railway Platform API',
    tagline: 'Track. Travel. Stay Connected.',
    status: 'ACTIVE',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      '/api/trains/search?q=12951',
      '/api/trains/:number',
      '/api/trains/:number/schedule',
      '/api/trains/:number/status',
      '/api/trains/:number/route',
      '/api/trains/:number/coaches',
      '/api/trains-between?from=MMCT&to=ADI',
      '/api/stations/search?q=mumbai',
      '/api/stations/:code',
      '/api/stations/:code/live',
      '/api/nearby-stations?lat=19.22&lng=72.85',
      '/api/exceptions',
      '/api/zones',
      '/api/alerts',
      '/api/pnr/:pnr',
      '/api/admin/providers',
    ],
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'NOT_FOUND',
    },
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server (skipped when running tests or when deployed as a serverless function)
const isServerless =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.LAMBDA_TASK_ROOT ||
  process.env.SERVERLESS === 'true';
if (process.env.NODE_ENV !== 'test' && !isServerless) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚂 WHERE IS MY TRAIN - BACKEND SERVER ACTIVE`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🛰️ Primary Provider: ${process.env.DEFAULT_DATA_PROVIDER || 'mock'}`);
    console.log(`🛡️ Rate Limiting: Active`);
    console.log(`====================================================`);
  });
}

export default app;
