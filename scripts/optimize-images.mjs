
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../client/data');
const outputDir = path.resolve(__dirname, '../client/data/optimized');

async function optimizeImages() {
  await fs.ensureDir(outputDir);

  const files = await fs.readdir(dataDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const inputPath = path.join(dataDir, file);
      const outputPath = path.join(outputDir, file);

      console.log(`Optimizing ${file}...`);

      await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .toFile(outputPath);
    }
  }

  console.log('Image optimization complete.');
}

optimizeImages();
