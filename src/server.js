// src/server.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// --- ✅ Robust .env loading (tries src/.env then project root .env) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary: src/.env
const envPathSrc = path.resolve(__dirname, '.env');
// Fallback: project root .env (one level up)
const envPathRoot = path.resolve(__dirname, '../.env');

let loaded = false;
if (envPathSrc) {
  const r = dotenv.config({ path: envPathSrc });
  if (!r.error) {
    console.log(`[env] Loaded env from ${envPathSrc}`);
    loaded = true;
  }
}
if (!loaded) {
  const r = dotenv.config({ path: envPathRoot });
  if (!r.error) {
    console.log(`[env] Loaded env from ${envPathRoot}`);
    loaded = true;
  }
}
if (!loaded) {
  console.warn('[env] No .env file found at src/.env or project root .env — relying on process.env');
}
// -------------------------------------------------

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestId } from './middleware/requestId.js';
import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';
import orderRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import settingsRouter from './routes/settings.js';
import couponsRouter from './routes/coupons.js';
import userRouter from './routes/user.js';
import authRouter from './routes/auth.js';
import { initMenuService } from './services/menuService.js';

// githubAuth router (custom server-side GitHub flow)
import githubAuthRouter from './routes/githubAuth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// quick sanity checks for important envs
console.log('[env check]',
  'SUPABASE_URL=', !!process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY=', !!process.env.SUPABASE_SERVICE_KEY
);

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn('[env warning] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing — githubAuth routes will fail until set.');
} else {
  console.log('[env check] GITHUB_CLIENT_ID present');
}

app.set('trust proxy', 1); // trust first proxy
console.log(`[server] trust proxy: ${app.get('trust proxy')}`);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// JSON parse guard
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[server] Invalid JSON received:', err.message);
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }
  next(err);
});

// middleware
app.use(requestId);
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- CORS: dynamic whitelist based on env (supports localhost + production Pages domain) ---
// Set CORS_ALLOWED_ORIGINS as a comma-separated list, e.g.:
// CORS_ALLOWED_ORIGINS="http://localhost:5173,https://miya-bhai-webapp-v1.pages.dev"
const rawAllowed = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173';
const allowedOrigins = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.options('*', cors(corsOptions)); // enable pre-flight
app.use(cors(corsOptions));
// --------------------------------------------------------------------------------

app.use(cookieParser());

// routes
// Mount GitHub custom auth router first so /api/auth/github/* is handled
app.use('/api', githubAuthRouter);

// existing auth router (other auth endpoints like /api/auth/verify remain)
app.use('/api', authRouter);
app.use('/api', healthRouter);
app.use('/api', menuRouter);
app.use('/api', orderRouter);
app.use('/api', adminRouter);
app.use('/api', settingsRouter);
app.use('/api', couponsRouter);
app.use('/api/user', userRouter);

// 404 + error
app.use((req, res) => res.status(404).json({ status: 'error', message: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('[server error]', err.stack || err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

async function startServer() {
  await initMenuService();
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server running → http://localhost:${PORT}`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      // show mount confirmation
      console.log('[server] mounted routes: /api (githubAuth, auth, health, menu, order, admin, settings, coupons, user)');
    });
  }
}

startServer();
export default app;
