import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';               // <-- ADDED
import { requestId } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';
import orderRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import settingsRouter from './routes/settings.js';
import couponsRouter from './routes/coupons.js';
import userRouter from './routes/user.js';
import authRouter from './routes/auth.js';               // <-- ADDED (magic link + auth)
import { initMenuService } from './services/menuService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing: larger JSON limit and accept urlencoded bodies
app.use(express.json({ limit: '1mb' })); // increase if you expect larger payloads
app.use(express.urlencoded({ extended: true }));

// JSON parse error handler (prevents body-parser SyntaxError from crashing server)
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[server] Invalid JSON received:', err.message);
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }
  next(err);
});

// Request ID middleware (keeps existing behavior)
app.use(requestId);

// Simple request logger to help debug requests (non-verbose)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming ${req.method} ${req.originalUrl}`);
  next();
});

// CORS: allow frontend (dev) to call API with cookies
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Parse cookies (required for session cookie set by /auth/verify)
app.use(cookieParser()); // <-- ADDED

// Routes
app.use('/api', healthRouter);
app.use('/api', menuRouter);
app.use('/api', orderRouter);
app.use('/api', adminRouter); // <-- new admin routes mounted here
app.use('/api', settingsRouter);
app.use('/api', couponsRouter);
app.use('/api', authRouter);  // <-- ADDED: mounts /api/auth/* (magic link endpoints)
app.use('/api', userRouter);

// Generic 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

// Basic Error Handler (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

async function startServer() {
  await initMenuService();
  
  if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
          console.log(`Server is running on http://localhost:${PORT}`);
          console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
          console.log(`USE_MOCK: ${process.env.USE_MOCK === 'true'}`);
      });
  }
}

startServer();

export default app;
