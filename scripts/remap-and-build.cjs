// Node 18+ (CommonJS/ES interop safe). Save as scripts/remap-and-build.cjs
const fs = require('fs');
const path = require('path');

const SRC_PATHS = [
  path.resolve(__dirname, 'menu-updated.txt'),
  path.resolve(__dirname, 'menu.txt'),
  path.resolve(__dirname, '../client/src/data/menu.canonical.json')
];

// find first readable source
const src = SRC_PATHS.find(p => fs.existsSync(p));
if (!src) {
  console.error("No menu source found. Place menu-updated.txt or menu.txt in scripts/ or canonical in client/src/data/");
  process.exit(1);
}
console.log("Using source:", src);

const rawText = fs.readFileSync(src, 'utf8');

// try to parse as JSON first
let blobs = [];
try {
  const parsed = JSON.parse(rawText);
  // If file contains { menu: [...] } use that array
  if (Array.isArray(parsed)) blobs = parsed;
  else if (Array.isArray(parsed.menu)) blobs = parsed.menu;
  else {
    // flatten possible multiple arrays inside keys
    Object.values(parsed).forEach(v => {
      if (Array.isArray(v)) blobs.push(...v);
    });
  }
} catch (e) {
  // fallback: crude object extraction like earlier
  const objRegex = /\{[^}]*\}/g;
  let m;
  while ((m = objRegex.exec(rawText)) !== null) {
    const s = m[0].replace(/(\b[A-Za-z0-9_]+\b)\s*:/g, '"$1":').replace(/'/g, '"');
    try {
      const o = JSON.parse(s);
      if (o && (o.id || o.name || o.title)) blobs.push(o);
    } catch (err) {
      // ignore parse fails
    }
  }
}

console.log("Found items (raw blobs):", blobs.length);

// normalize helper
const norm = (v) => (v || '').toString().trim();
const lc = (v) => norm(v).toLowerCase();

// simple heuristic map: keyword -> category
const keywordMap = [
  { kws: ['biryani'], cat: 'Biryani' },
  { kws: ['mandi', 'mandi'], cat: 'Mandi' },
  { kws: ['shawarma'], cat: 'Shawarma' },
  { kws: ['kebab', 'kebabs', 'tandoori', 'kebab'], cat: 'Kebabs & Grills' },
  { kws: ['shawarma'], cat: 'Shawarma' },
  { kws: ['pizza','burger','sandwich'], cat: 'Continental' },
  { kws: ['dosa','idli','tiffin','pur i', 'puri'], cat: 'Tiffin' },
  { kws: ['juice','milkshake','mocktail','coffee','tea','beverage'], cat: 'Beverages' },
  { kws: ['chutney','sambar','rasam'], cat: 'Chutneys' },
  { kws: ['meal','rice','dal','curry','masala','paneer','mutton','chicken','fish'], cat: 'Main Course' },
  // fallback: Meals / Starters mapping will be refined by suspects
];

// decide heuristic category for an item
function heuristicCategory(item) {
  const hay = [item.id, item.title, item.subcategory, item.subCategory, item.description].filter(Boolean).map(x => lc(x)).join(' ');
  for (const m of keywordMap) {
    for (const kw of m.kws) {
      if (hay.includes(kw)) return m.cat;
    }
  }
  return item.category || 'Uncategorized';
}

// normalize and produce canonical item
function normalizeItem(raw) {
  const it = {};
  it.id = raw.id || raw.name || (raw.title && lc(raw.title).replace(/\s+/g,'-')) || null;
  it.title = raw.title || raw.name || it.id || 'Untitled';
  it.category = raw.category || raw.Category || raw.group || 'Uncategorized';
  it.subcategory = raw.subcategory || raw.subCategory || raw.sub_cat || null;
  it.description = raw.description || raw.desc || '';
  it.image = raw.image === null ? null : (raw.image || null);
  it.price = (typeof raw.price === 'number') ? raw.price : null;
  it.prices = raw.prices || null;
  it.variants = Array.isArray(raw.variants) ? raw.variants : null;
  it.available = (typeof raw.available === 'boolean') ? raw.available : true;
  it.raw = raw;
  return it;
}

// build canonical
const byId = new Map();
for (const r of blobs) {
  const n = normalizeItem(r);
  if (!n.id) {
    // synth id
    n.id = lc(n.title).replace(/[^a-z0-9\-]+/g,'-').replace(/^\-+|\-+$/g,'');
  }
  // merge policy: if exists, merge variants/prices if missing
  if (byId.has(n.id)) {
    const prev = byId.get(n.id);
    prev.title = prev.title || n.title;
    prev.description = prev.description || n.description;
    prev.image = prev.image || n.image;
    prev.price = prev.price || n.price;
    prev.prices = prev.prices || n.prices;
    prev.variants = prev.variants || n.variants;
    prev.available = prev.available && n.available;
    prev.raws = prev.raws || [];
    prev.raws.push(n.raw);
    byId.set(n.id, prev);
  } else {
    byId.set(n.id, n);
  }
}

// convert map to list and apply biryani remapping + suspect detection
const canonical = [];
const suspects = [];
let movedToBiryani = 0;

for (const [id, item] of byId.entries()) {
  // heuristics to detect biryani
  const hay = [item.id, item.title, item.subcategory, item.description].filter(Boolean).map(x => lc(x)).join(' ');
  const looksLikeBiryani = hay.includes('biryani') || hay.includes('dum-biryani') || /(^|[-_ ])biryani($|[-_ ])/i.test(item.id);
  if (looksLikeBiryani) {
    if (item.category !== 'Biryani') {
      item._oldCategory = item.category;
      item.category = 'Biryani';
      movedToBiryani++;
    }
  }

  // heuristic category
  const hcat = heuristicCategory(item);
  if (hcat && norm(hcat) !== norm(item.category)) {
    suspects.push({
      id: item.id,
      title: item.title,
      current: item.category,
      heuristic: hcat
    });
  }

  canonical.push(item);
}

// sort canonical by category/title
canonical.sort((a,b) => {
  const c = (a.category||'').localeCompare(b.category||'');
  return c !== 0 ? c : (a.title||'').localeCompare(b.title||'');
});

// write tmp output and report
const TMP_DIR = path.resolve(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const OUT = path.join(TMP_DIR, 'menu.canonical.json.tmp');
const REPORT = path.join(TMP_DIR, 'menu_remap_report.json');

fs.writeFileSync(OUT, JSON.stringify(canonical, null, 2), 'utf8');

const report = {
  source: src,
  total_items: canonical.length,
  moved_to_biryani: movedToBiryani,
  suspect_count: suspects.length,
  suspect_samples: suspects.slice(0, 30)
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');

console.log("WROTE TMP CANONICAL:", OUT);
console.log("WROTE REPORT:", REPORT);
console.log("SUMMARY:", report);
if (suspects.length) {
  console.log("\nSUSPECT SAMPLE (first 10):");
  console.table(suspects.slice(0,10));
}
console.log("\nNext steps:");
console.log("1) Review tmp file:", OUT);
console.log("2) If OK, mv tmp file -> client/src/data/menu.canonical.json (atomic replace).");
console.log("3) Run UI & spot-check categories: Biryani, Tiffin, Arabian, Beverages.");
