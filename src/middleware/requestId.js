
import { randomUUID } from 'crypto';

export const requestId = (req, res, next) => {
  const requestId = randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  console.log(`[${new Date().toISOString()}] Request ID: ${requestId}, Path: ${req.method} ${req.originalUrl}`);
  next();
};
