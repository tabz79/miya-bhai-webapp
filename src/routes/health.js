// src/routes/health.js
import { Router } from 'express';
import * as menuService from '../services/menuService.js';

const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const menuStats = await menuService.getStats();
  const uptime = process.uptime();
  
  res.status(200).json({
    status: 'ok',
    uptime,
    menu: menuStats,
    node_env: process.env.NODE_ENV || 'development',
    use_mock: process.env.USE_MOCK === 'true',
  });
});

export default healthRouter;