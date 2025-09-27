
const fs = require('fs');
const path = require('path');

const canonicalMenuPath = path.join(__dirname, '..', 'src', 'data', 'menu.canonical.json');
const publicPath = path.join(__dirname, '..', 'public');
const reportPath = path.join(__dirname, '..', 'reports', 'menu-csv-implementation-report.json');

const placeholderPath = '/src/assets/placeholder-menu-item.png';

try {
  const menuData = JSON.parse(fs.readFileSync(canonicalMenuPath, 'utf-8'));
  const missingImages = [];

  console.log('Starting image validation...');

  for (const item of menuData) {
    if (item.image && item.image !== placeholderPath) {
      // We expect paths like '/images/menu/some-image.png'
      const imagePathOnDisk = path.join(publicPath, item.image);
      
      if (!fs.existsSync(imagePathOnDisk)) {
        missingImages.push({
          id: item.id,
          title: item.title,
          imagePath: item.image,
          expectedLocation: imagePathOnDisk,
        });
      }
    }
  }

  // Update report
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  report.validation = {
    status: missingImages.length === 0 ? 'success' : 'failed',
    missingImages: missingImages,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (missingImages.length > 0) {
    console.error(`Validation FAILED: ${missingImages.length} image(s) are missing.`);
    missingImages.forEach(img => {
      console.error(`- Dish: "${img.title}" (ID: ${img.id}) is missing image: ${img.imagePath}`);
    });
    process.exit(1);
  } else {
    console.log('Validation PASSED: All images referenced in the menu exist.');
  }

} catch (error) {
  console.error('Image validation script failed:', error);
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf-8')) : {};
  report.validation = {
    status: 'error',
    error: error.message,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(1);
}
