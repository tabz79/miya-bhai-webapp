
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'menu.csv');
const jsonOutputPath = path.join(__dirname, '..', 'src', 'data', 'menu.canonical.json');
const assetsBasePath = path.join(__dirname, '..', 'src', 'assets');
const publicMenuImagesPath = path.join(__dirname, '..', 'public', 'images', 'menu');
const reportPath = path.join(__dirname, '..', 'reports', 'menu-csv-implementation-report.json');

const placeholderPath = '/src/assets/placeholder-menu-item.png';

// --- Simple CSV Parser ---
function parseCSV(content) {
  const rows = content.trim().split('\n');
  const headers = rows.shift().split(',').map(h => h.trim());
  return rows.map(rowStr => {
    const values = rowStr.split(',').map(v => v.trim());
    // Basic handling for quoted fields, not robust for complex CSVs
    // This is a simplified parser for this specific use case.
    let inQuote = false;
    let field = '';
    const parsedValues = [];
    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' && (i === 0 || rowStr[i-1] !== '\\')) {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            parsedValues.push(field);
            field = '';
        } else {
            field += char;
        }
    }
    parsedValues.push(field); // add last field

    const obj = {};
    headers.forEach((header, i) => {
      let value = (parsedValues[i] || '').trim();
      // Un-escape quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      obj[header] = value;
    });
    return obj;
  });
}

// --- Slugify function ---
const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
};

try {
  if (!fs.existsSync(publicMenuImagesPath)) {
    fs.mkdirSync(publicMenuImagesPath, { recursive: true });
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const menuItems = parseCSV(csvData);

  const finalMenu = [];
  const seenIds = new Set();
  const imagesMissing = [];
  const imagesCopied = [];
  let idsGenerated = 0;

  const imagesMap = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'images-map.json'), 'utf-8'));

  for (const item of menuItems) {
    let id = item.id;
    if (!id) {
      let baseSlug = slugify(item.title);
      id = baseSlug;
      let counter = 1;
      while (seenIds.has(id)) {
        id = `${baseSlug}-${counter}`;
        counter++;
      }
      idsGenerated++;
    }
    
    if (seenIds.has(id)) {
        console.warn(`Build warning: Duplicate ID '${id}' found for title '${item.title}'. Skipping.`);
        continue;
    }
    seenIds.add(id);

    let imagePath = placeholderPath;
    const slug = slugify(item.title);
    const imageMapEntry = imagesMap[slug];

    if (imageMapEntry && imageMapEntry.url) {
      imagePath = imageMapEntry.url;
    } else {
      imagesMissing.push({ id, expectedSlug: slug });
    }

    const tags = item.tags ? item.tags.split(';') : [];

    finalMenu.push({
      id: id,
      title: item.title,
      category: item.category,
      subcategory: item.subcategory || null,
      description: item.description || '',
      image: imagePath,
      price: parseFloat(item.price) || 0,
      prices: null, // Preserve structure
      variants: null, // Preserve structure
      available: item.available ? item.available.toLowerCase() === 'true' : false,
      raw: { // Synthesize minimal raw structure
        id: `${id}-raw`,
        name: item.title,
        category: item.category,
        subCategory: item.subcategory || null,
        price: parseFloat(item.price) || 0,
        image: imagePath, // Match top-level image
        isBestSeller: tags.includes('bestseller'),
        isSignature: tags.includes('signature'),
      }
    });
  }

  fs.writeFileSync(jsonOutputPath, JSON.stringify(finalMenu, null, 2));

  // Update report
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  report.build = {
    status: 'success',
    idsGenerated,
    destination: jsonOutputPath,
  };
  report.imagesCopied = imagesCopied;
  report.imagesMissing = imagesMissing;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Build complete. ${finalMenu.length} items written to ${jsonOutputPath}.`);
  if (imagesMissing.length > 0) {
    console.warn(`Warning: ${imagesMissing.length} image file(s) not found. See report.`);
  }

} catch (error) {
  console.error('Build failed:', error);
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf-8')) : {};
  report.build = {
    status: 'failed',
    error: error.message,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(1);
}
