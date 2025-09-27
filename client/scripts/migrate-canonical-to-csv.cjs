const fs = require('fs');
const path = require('path');

const canonicalMenuPath = path.join(__dirname, '..', 'src', 'data', 'menu.canonical.json');
const csvOutputPath = path.join(__dirname, '..', 'data', 'menu.csv');
const reportPath = path.join(__dirname, '..', 'reports', 'menu-csv-implementation-report.json');

const placeholder = '/src/assets/placeholder-menu-item.png';

// Helper to escape CSV fields
const escapeCsvField = (field) => {
  if (field === null || field === undefined) {
    return '""';
  }
  const stringField = String(field);
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

try {
  // Ensure reports directory exists
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  const menuData = JSON.parse(fs.readFileSync(canonicalMenuPath, 'utf-8'));
  
  const headers = ['id', 'title', 'description', 'price', 'category', 'subcategory', 'image_filename', 'tags', 'available'];
  const csvRows = [headers.join(',')];
  
  let rowsConverted = 0;
  const idConflicts = [];
  const seenIds = new Set();

  for (const item of menuData) {
    if (seenIds.has(item.id)) {
      idConflicts.push({ id: item.id, title: item.title });
      continue; // Skip duplicate IDs
    }
    seenIds.add(item.id);

    const image_filename = (item.image && item.image !== placeholder)
      ? path.basename(item.image)
      : '';

    const tags = [];
    if (item.raw?.isBestSeller) tags.push('bestseller');
    if (item.raw?.isSignature) tags.push('signature');

    const row = [
      item.id || '',
      item.title || '',
      item.description || '',
      item.price || 0,
      item.category || '',
      item.subcategory || '',
      image_filename,
      tags.join(';'), // Using semicolon as it's less common in descriptions
      item.available !== undefined ? item.available : true,
    ];
    
    csvRows.push(row.map(escapeCsvField).join(','));
    rowsConverted++;
  }

  fs.writeFileSync(csvOutputPath, csvRows.join('\n'));

  const report = {
    migration: {
      status: 'success',
      rowsConverted,
      conflicts: idConflicts,
      source: canonicalMenuPath,
      destination: csvOutputPath,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Migration complete. ${rowsConverted} rows converted to ${csvOutputPath}`);
  if (idConflicts.length > 0) {
    console.warn(`Warning: ${idConflicts.length} duplicate ID(s) found. See report for details.`);
  }

} catch (error) {
  console.error('Migration failed:', error);
  const report = {
    migration: {
      status: 'failed',
      error: error.message,
    }
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(1);
}
