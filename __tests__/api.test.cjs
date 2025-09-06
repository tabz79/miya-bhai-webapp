// __tests__/api.test.cjs
const request = require('supertest');

let app; // will hold the Express app after dynamic import
let serverInstance; // optional: if src/server exports an http.Server

// Prevent console.log noise during tests
beforeAll(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  // Dynamically import the ESM server module
  const mod = await import('../src/server.js');
  // Support both `export default app` and `module.exports = app`
  app = mod.default || mod.app || mod;
  // If module exports a started server (http.Server), try to keep reference
  serverInstance = mod.server || mod.serverInstance || null;
});

afterAll(async () => {
  jest.restoreAllMocks();
  // If module exported a server instance with close(), try to close it to free the port
  try {
    if (serverInstance && typeof serverInstance.close === 'function') {
      await new Promise((resolve) => serverInstance.close(() => resolve()));
    }
  } catch (e) {
    // ignore close errors in teardown
  }
});

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return a health check response with status 200', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('db', 'mocked');
      expect(res.body).toHaveProperty('cache', 'mocked');
    });
  });

  describe('GET /api/menu', () => {
    it('should return the first page with default limit', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.payload.page).toBe(1);
      expect(res.body.payload.limit).toBe(10);
      expect(Array.isArray(res.body.payload.items)).toBe(true);
      expect(res.body.payload.items.length).toBe(10);
      expect(res.body.payload.total).toBe(12);
    });

    it('should return a specific page and limit', async () => {
      const res = await request(app).get('/api/menu?page=2&limit=5');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.payload.page).toBe(2);
      expect(res.body.payload.limit).toBe(5);
      expect(Array.isArray(res.body.payload.items)).toBe(true);
      expect(res.body.payload.items.length).toBe(5);
      expect(res.body.payload.total).toBe(12);
    });

    it('should return a 400 error for invalid query parameters', async () => {
      const res = await request(app).get('/api/menu?page=-1&limit=abc');
      // server may return 400 or another 4xx; assert 400+ and error shape
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toEqual(expect.stringContaining('Invalid'));
    });

    it('should return a 400 error for page 0', async () => {
      const res = await request(app).get('/api/menu?page=0');
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toEqual(expect.stringContaining('Invalid'));
    });
  });

  describe('GET /api/menu/:id', () => {
    it('should return a specific menu item by id', async () => {
      const id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const res = await request(app).get(`/api/menu/${id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.payload).toHaveProperty('id', id);
      expect(res.body.payload).toHaveProperty('name');
    });

    it('should return a 404 error for a non-existent menu item', async () => {
      const res = await request(app).get('/api/menu/non-existent-id');
      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('not found');
    });
  });

  describe('Request ID Middleware', () => {
    it('should include an X-Request-Id header in the response', async () => {
      const res = await request(app).get('/api/health');
      // header keys are lower-cased in supertest/Node
      expect(res.headers).toHaveProperty('x-request-id');
      expect(typeof res.headers['x-request-id']).toBe('string');
    });
  });
});
