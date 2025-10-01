import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestId } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';
import orderRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import { initMenuService } from './services/menuService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(requestId);

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
