
import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const healthRouter = Router();

const getVersion = async () => {
    try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = await fs.readFile(packageJsonPath, 'utf8');
        return JSON.parse(packageJson).version || 'unknown';
    } catch (error) {
        console.error('Failed to read package.json for version', error);
        return 'unknown';
    }
};

healthRouter.get('/health', async (req, res) => {
  const version = await getVersion();
  res.status(200).json({
    status: 'ok',
    version,
    timestamp: new Date().toISOString(),
    db: 'mocked',
    cache: 'mocked'
  });
});

export default healthRouter;
