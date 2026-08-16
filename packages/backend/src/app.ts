import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';

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

// TODO: Add routes here
// - Authentication routes
// - Check-in routes
// - Widget routes
// - Progress routes
// - Parent routes

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

const PORT = parseInt(env.BACKEND_PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`✓ Environment: ${env.NODE_ENV}`);
});

export default app;
