
import { promises as fs } from 'fs';
import path from 'path';

const menuFilePath = path.join(process.cwd(), 'data', 'menu.json');

let menuDataCache = null;

async function getMenuData() {
  if (process.env.NODE_ENV === 'test' && menuDataCache) {
    return menuDataCache;
  }
  const fileContent = await fs.readFile(menuFilePath, 'utf8');
  menuDataCache = JSON.parse(fileContent);
  return menuDataCache;
}

export const list = async ({ page, limit }) => {
  const items = await getMenuData();
  const total = items.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return { items: paginatedItems, total };
};

export const getById = async (id) => {
  const items = await getMenuData();
  return items.find(item => item.id === id);
};
