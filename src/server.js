
import express from 'express';
import { requestId } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(requestId);

// Routes
app.use('/api', healthRouter);
app.use('/api', menuRouter);

// Generic 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;
