
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_INPUT_PATH = path.resolve(process.cwd(), 'client/data/offer-banner.csv');
const JSON_OUTPUT_PATH = path.resolve(process.cwd(), 'client/public/banners.json');
const IMAGE_BASE_PATH = '/images/banners'; // Web-accessible path

async function buildBanners() {
  console.log('Starting banner build...');

  try {
    // 1. Read the CSV file
    const csvContent = await fs.readFile(CSV_INPUT_PATH, 'utf8');

    // 2. Parse the CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // 3. Process records and map to final JSON structure
    const now = new Date();
    const banners = records
      .map(record => {
        // Basic validation
        if (!record.id || !record.title || !record.public_id) {
          console.warn(`Skipping invalid record: ${JSON.stringify(record)}`);
          return null;
        }

        // Check status
        if (record.status && record.status.toLowerCase() !== 'active') {
          return null;
        }

        // Check date range
        const starts = record.startDate ? new Date(record.startDate) : new Date('1970-01-01');
        const ends = record.endDate ? new Date(record.endDate) : new Date('2999-12-31');
        if (now < starts || now > ends) {
          return null;
        }

        return {
          id: record.id,
          title: record.title,
          // The 'image' property will hold the final, web-accessible URL
          // resolveImage can use this directly.
          image: `${IMAGE_BASE_PATH}/${record.public_id}.png`,
        };
      })
      .filter(Boolean); // Filter out null records

    // 4. Write the final JSON file
    await fs.writeFile(JSON_OUTPUT_PATH, JSON.stringify(banners, null, 2));

    console.log(`Successfully built ${banners.length} active banners to ${JSON_OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error building banners:', error);
    process.exit(1);
  }
}

buildBanners();
