import { Router } from 'express';
import * as menuService from '../services/menuService.js';
import { validatePaginationQuery } from '../validators/queryValidator.js';

const menuRouter = Router();

menuRouter.get('/', validatePaginationQuery, async (req, res) => {
  const { page = 1, limit } = req.query;

  try {
    const { items, total } = await menuService.list({ page, limit });
    const stats = await menuService.getStats();

    const payload = {
      items: items || [],
      page: Number(page),
      limit: limit ? Number(limit) : total,
      total,
    };

    if (process.env.NODE_ENV !== 'production') {
      payload._meta = {
        source: stats.source,
        timestamp: new Date().toISOString(),
      };
    }

    res.status(200).json({ status: 'ok', payload });
  } catch (error) {
    console.error('Error fetching menu from menuService:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

menuRouter.get('/menu/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await menuService.getById(id);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'not found' });
    }
    res.status(200).json({ status: 'ok', payload: item });
  } catch (error) {
    console.error(`Error fetching menu item ${id}:`, error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

export default menuRouter;

