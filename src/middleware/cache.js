
// src/middleware/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

export default function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`[cache] HIT: ${key}`);
    res.send(cachedResponse);
  } else {
    console.log(`[cache] MISS: ${key}`);
    res.originalSend = res.send;
    res.send = (body) => {
      cache.set(key, body);
      res.originalSend(body);
    };
    next();
  }
}
