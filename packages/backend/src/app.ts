import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import taughtlogRoutes from './routes/taughtlog.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import progressRoutes from './routes/progress.routes.js';
import parentRoutes from './routes/parent.routes.js';
import reconfirmRoutes from './routes/reconfirm.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import { initializeScheduler } from './jobs/scheduler.job.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import {
  globalLimiter,
  authLimiter,
  studentApiLimiter,
  checkinLimiter,
  parentLinkLimiter,
} from './middleware/rateLimiter.middleware.js';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // In development, allow localhost on any port
    if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    // In production, only allow configured frontend URL
    if (origin === env.FRONTEND_URL) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Apply global limiter to all routes
app.use(globalLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes); // Stricter auth rate limiting
app.use('/api/checkin', checkinLimiter, checkinRoutes); // Per-student check-in limiting
app.use('/api/taught-log', studentApiLimiter, taughtlogRoutes); // Standard API limiting
app.use('/api/widget', studentApiLimiter, widgetRoutes); // Standard API limiting
app.use('/api/progress', studentApiLimiter, progressRoutes); // Standard API limiting
app.use('/api/parent', parentLinkLimiter, parentRoutes); // Parent linking limiting
app.use('/api/reconfirm', studentApiLimiter, reconfirmRoutes); // Standard API limiting
app.use('/api/scheduler', studentApiLimiter, schedulerRoutes); // Standard API limiting

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? env.BACKEND_PORT ?? '5000', 10);

app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`✓ Environment: ${env.NODE_ENV}`);

  // Initialize the nightly scheduler
  console.log(`✓ Initializing scheduler (timezone: ${env.SCHEDULER_TIMEZONE})...`);
  initializeScheduler();
});

export default app;
