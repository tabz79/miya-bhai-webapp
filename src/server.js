import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestId } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';
import orderRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import settingsRouter from './routes/settings.js';
import { initMenuService } from './services/menuService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing: larger JSON limit and accept urlencoded bodies
app.use(express.json({ limit: '1mb' })); // increase if you expect larger payloads
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api', healthRouter);
app.use('/api', menuRouter);
app.use('/api', orderRouter);
app.use('/api', adminRouter); // <-- new admin routes mounted here
app.use('/api', settingsRouter);

// Generic 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

// Basic Error Handler
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
