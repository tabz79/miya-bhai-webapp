
const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, '..', 'client', 'src', 'data', 'menu.canonical.json');
const dishNamesPath = path.join(__dirname, '..', 'dish-names.txt');
const rawImagesPath = path.join(__dirname, '..', 'client', 'src', 'assets', 'raw');
const reportPath = path.join(__dirname, 'image-mapping-report-v2.json');
const synonymsPath = path.join(__dirname, 'image-synonyms.json');

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\(full\)|\(half\)|\(mini\)|\(boneless\)|- 6pc/g, '')
    .replace(/[\s-]/g, '')
    .replace(/\(sweet\/salt\)/, '');
};

const run = async () => {
  const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  const dishNames = fs.readFileSync(dishNamesPath, 'utf-8').split('\r\n').filter(Boolean);
  const rawImages = fs.readdirSync(rawImagesPath);
  const synonyms = JSON.parse(fs.readFileSync(synonymsPath, 'utf-8'));

  const imageMap = new Map();
  dishNames.forEach(dishName => {
    const normalized = normalizeString(path.parse(dishName).name);
    if (imageMap.has(normalized)) {
      imageMap.get(normalized).push(dishName);
    } else {
      imageMap.set(normalized, [dishName]);
    }
  });

  const report = {
    matched: [],
    unmatched: [],
    ambiguous: [],
  };

  const updatedMenu = menuData.map(dish => {
    if (dish.image) {
      return dish;
    }

    let normalizedTitle = normalizeString(dish.title);
    let match = imageMap.get(normalizedTitle);

    // If no direct match, try synonyms
    if (!match && synonyms[normalizedTitle]) {
      const synonymNormalized = normalizeString(synonyms[normalizedTitle]);
      match = imageMap.get(synonymNormalized);
    }

    if (match && match.length === 1) {
      const imagePath = `client/src/assets/raw/${match[0]}`;
      dish.image = imagePath;
      report.matched.push({ title: dish.title, image: imagePath });
    } else if (match && match.length > 1) {
      report.ambiguous.push({ title: dish.title, matches: match });
      report.unmatched.push(dish.title);
    }
    else {
      report.unmatched.push(dish.title);
    }

    return dish;
  });

  fs.writeFileSync(menuPath, JSON.stringify(updatedMenu, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('Image mapping process (v2) completed.');
  console.log(`Matched: ${report.matched.length}`);
  console.log(`Unmatched: ${report.unmatched.length}`);
  console.log(`Ambiguous: ${report.ambiguous.length}`);
};

run();
