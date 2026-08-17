import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import checkinRoutes from './routes/checkin.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import progressRoutes from './routes/progress.routes.js';
import parentRoutes from './routes/parent.routes.js';
import reconfirmRoutes from './routes/reconfirm.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import { initializeScheduler } from './jobs/scheduler.job.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/reconfirm', reconfirmRoutes);
app.use('/api/scheduler', schedulerRoutes);

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(env.BACKEND_PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`✓ Environment: ${env.NODE_ENV}`);

  // Initialize the nightly scheduler
  console.log(`✓ Initializing scheduler (timezone: ${env.SCHEDULER_TIMEZONE})...`);
  initializeScheduler();
});

export default app;
