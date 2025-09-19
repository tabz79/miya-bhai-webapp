// scripts/build-canonical-from-txt.cjs
// Run: node scripts/build-canonical-from-txt.cjs
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const menuTxtPath = path.join(repoRoot, 'menu.txt'); // you uploaded here
const dishesTxtPath = path.join(repoRoot, 'dish-names.txt'); // you uploaded here
const outPath = path.join(repoRoot, 'client', 'src', 'data', 'menu.canonical.json');

if (!fs.existsSync(menuTxtPath)) {
  console.error('menu.txt not found at', menuTxtPath);
  process.exit(1);
}
if (!fs.existsSync(dishesTxtPath)) {
  console.error('dish-names.txt not found at', dishesTxtPath);
  process.exit(1);
}

const rawMenu = fs.readFileSync(menuTxtPath, 'utf8');
const rawDishes = fs.readFileSync(dishesTxtPath, 'utf8');

// parse dish filenames into array
const dishFiles = rawDishes
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(Boolean);

// helper slugify (match logic)
const slugify = s =>
  (s || '')
    .toString()
    .normalize ? s.normalize('NFKD').replace(/[\u0300-\u036F]/g,'') : s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

// parse menu.txt for objects: naive but works for your format
// find occurrences of { ... } blocks that contain id or title
const blocks = [];
let cur = null;
const lines = rawMenu.split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) continue;
  if (trimmed.startsWith('{')) {
    cur = [trimmed];
    continue;
  }
  if (cur) {
    cur.push(trimmed);
    if (trimmed.endsWith('},') || trimmed === '},' || trimmed === '}') {
      blocks.push(cur.join('\n'));
      cur = null;
    }
  }
}
// fallback: if no blocks parsed, try splitting by '},' occurrences
if (blocks.length === 0) {
  const parts = rawMenu.split(/},\s*\n/);
  for (const p of parts) {
    if (p.includes('id') || p.includes('title') || p.includes('name')) blocks.push(p + '\n}');
  }
}

// from each block extract id/title/category/price/subcategory
const items = blocks.map(b => {
  const get = (k) => {
    const m = b.match(new RegExp(`${k}\\s*:\\s*["']([^"']+)["']`, 'i'));
    if (m) return m[1].trim();
    // try name: "x" or title: "x"
    return null;
  };
  // also try patterns like title: "..." or name: "..."
  const id = get('id') || get('name') || null;
  const title = get('title') || get('name') || null;
  const category = get('category') || null;
  // price is sometimes numeric without quotes: price: 120,
  let price = null;
  const mPrice = b.match(/price\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (mPrice) price = Number(mPrice[1]);
  const subcategory = get('subcategory') || get('subCategory') || null;
  return { id, title, category, subcategory, price, rawBlock: b };
})
.filter(it => it.id || it.title);

// build map of dish filename slugs
const dishMap = {};
for (const f of dishFiles) {
  const nameOnly = f.replace(/\.[^.]+$/, '').trim();
  const s = slugify(nameOnly);
  dishMap[s] = f;
}

// match items to filenames
const matched = [];
const unmatched = [];
const canonical = items.map(it => {
  const name = it.title || it.id || 'unknown';
  const s = slugify(name);
  // try exact slug
  let file = dishMap[s] || null;
  // try token-based fuzzy: check any dish key that contains a token from s
  if (!file) {
    const toks = s.split('-').filter(Boolean);
    let best = null, bestScore = 0;
    for (const key of Object.keys(dishMap)) {
      const ktoks = key.split('-').filter(Boolean);
      const inter = toks.filter(t => ktoks.includes(t)).length;
      if (inter > bestScore) { bestScore = inter; best = key; }
    }
    if (bestScore > 0) file = dishMap[best];
  }
  if (file) {
    matched.push({ id: it.id, name, file });
  } else {
    unmatched.push({ id: it.id, name });
  }
  const imageUrl = file ? `/src/assets/raw/${file}` : null;
  return {
    id: it.id || slugify(name),
    name,
    category: it.category || it.subcategory || 'Uncategorized',
    price: it.price || null,
    imageUrl,
  };
});

// backup existing canonical if exists
if (fs.existsSync(outPath)) {
  fs.copyFileSync(outPath, outPath + '.bak');
  console.log('Backed up existing canonical to', outPath + '.bak');
}

// write canonical JSON
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(canonical, null, 2), 'utf8');

console.log('Wrote', canonical.length, 'items to', outPath);
console.log('Matched:', matched.length, 'Unmatched:', unmatched.length);
if (matched.length) {
  console.log('\nSAMPLE MATCHES (first 10):');
  matched.slice(0,10).forEach(m => console.log('-', m.name, '->', m.file));
}
if (unmatched.length) {
  console.log('\nUNMATCHED ITEMS (first 20):');
  unmatched.slice(0,20).forEach(u => console.log('-', u.name));
}
