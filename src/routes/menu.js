
import { Router } from 'express';
import * as menuService from '../services/menuService.js';
import { validatePaginationQuery } from '../validators/queryValidator.js';

const menuRouter = Router();

menuRouter.get('/menu', validatePaginationQuery, async (req, res) => {
  const { page, limit } = req.query;
  try {
    const { items, total } = await menuService.list({ page, limit });
    res.status(200).json({
      status: 'ok',
      payload: {
        items,
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
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
