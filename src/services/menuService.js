import fs from 'fs/promises';
import path from 'path';

// In-memory cache for menu data
let menuCache = null;
let menuStats = { source: 'none', count: 0, lastUpdated: null };

/**
 * Safely loads and parses a JSON file.
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {Promise<Array<any>>} - The parsed JSON data as an array.
 */
async function loadJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading or parsing JSON at ${filePath}:`, error);
    return []; // Return empty array on failure
  }
}

/**
 * Initializes the menu data source based on environment variables.
 */
export async function initMenuService() {
  const useMock = process.env.USE_MOCK === 'true';
  const canonicalPath = path.resolve(process.cwd(), 'client', 'src', 'data', 'menu.canonical.json');
  const mockPath = path.resolve(process.cwd(), 'data', 'menu.json');

  if (useMock) {
    console.log('Initializing menu service with MOCK data.');
    menuCache = await loadJson(mockPath);
    menuStats = { source: 'mock', count: menuCache.length, lastUpdated: new Date().toISOString() };
  } else {
    console.log('Initializing menu service with CANONICAL data.');
    menuCache = await loadJson(canonicalPath);
    menuStats = { source: 'canonical', count: menuCache.length, lastUpdated: new Date().toISOString() };
  }
  
  console.log(`Menu loaded. Source: ${menuStats.source}, Items: ${menuStats.count}`);
}

const MAX_MENU_LIMIT = process.env.MAX_MENU_LIMIT || 5000;

/**
 * Retrieves a paginated list of menu items.
 * @param {object} options - Pagination options.
 * @param {number} [options.page=1] - The page number to retrieve.
 * @param {number} [options.limit] - The number of items per page. If not provided, returns all items up to MAX_MENU_LIMIT.
 * @returns {Promise<{items: Array<any>, total: number}>}
 */
export async function list({ page = 1, limit } = {}) {
  if (!menuCache) {
    await initMenuService();
  }

  const total = menuCache.length;
  
  const effectiveLimit = Math.min(limit || MAX_MENU_LIMIT, MAX_MENU_LIMIT);

  const numericPage = Number(page);
  const startIndex = (numericPage - 1) * effectiveLimit;
  const endIndex = startIndex + effectiveLimit;
  const paginatedItems = menuCache.slice(startIndex, endIndex);

  return { items: paginatedItems, total };
}

/**
 * Retrieves a single menu item by its ID.
 * @param {string} id - The ID of the menu item.
 * @returns {Promise<object|null>}
 */
export async function getById(id) {
  if (!menuCache) {
    await initMenuService();
  }
  return menuCache.find(item => String(item.id) === String(id)) || null;
}

/**
 * Returns statistics about the current menu data.
 * @returns {Promise<object>}
 */
export async function getStats() {
  if (!menuCache) {
    await initMenuService();
  }
  return menuStats;
}