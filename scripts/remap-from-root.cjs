/**
 * remap-from-root.cjs
 * Purpose: Read D:/Projects/miya-bhai-webapp/menu-updated.txt (root), normalize items,
 *         remap biryani -> Biryani, apply overrides, produce tmp/menu.canonical.json.tmp
 *         and tmp/menu_remap_report.json
 *
 * Behavior:
 * - FAILS if root/menu-updated.txt is missing.
 * - No fallback to other files.
 * - Produces verbose console output so you can confirm what happened.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..'); // scripts/.. => repo root
const SRC = path.join(REPO_ROOT, 'menu-updated.txt'); // exact file you confirmed
const TMP_DIR = path.join(REPO_ROOT, 'tmp');
const OUT_TMP = path.join(TMP_DIR, 'menu.canonical.json.tmp');
const REPORT = path.join(TMP_DIR, 'menu_remap_report.json');

if (!fs.existsSync(SRC)) {
  console.error('ERROR: expected source file NOT FOUND ->', SRC);
  console.error('Please place menu-updated.txt in the repo root:', REPO_ROOT);
  process.exit(2);
}

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

console.log('Using exact source:', SRC);
const text = fs.readFileSync(SRC, 'utf8');

// Attempt JSON parse first (if file is JSON), else fallback to object-extract heuristic
let rawItems = [];
try {
  const parsed = JSON.parse(text);
  // Accept arrays at root or object { menu: [...] } or any top-level arrays
  if (Array.isArray(parsed)) rawItems = parsed;
  else if (parsed && Array.isArray(parsed.menu)) rawItems = parsed.menu;
  else {
    // gather arrays from object values (rare)
    Object.values(parsed).forEach(v => { if (Array.isArray(v)) rawItems.push(...v) });
  }
  console.log('Parsed input as JSON, items:', rawItems.length);
} catch (err) {
  console.log('Input not valid JSON — falling back to object-extract heuristic.');
  // crude object extraction: find blocks { ... } with id/title keys
  const objRegex = /\{[^}]*?\}/g;
  let m;
  while ((m = objRegex.exec(text)) !== null) {
    let s = m[0]
      .replace(/(\b[A-Za-z0-9_]+\b)\s*:/g, '"$1":') // quote keys
      .replace(/'/g, '"');                         // single->double quotes
    try {
      const o = JSON.parse(s);
      if (o && (o.id || o.name || o.title)) rawItems.push(o);
    } catch (e) {
      // ignore unparsable chunks
    }
  }
  console.log('Heuristic extracted items:', rawItems.length);
}

if (!rawItems.length) {
  console.error('ERROR: No items extracted from source file. Check file format and try again.');
  process.exit(3);
}

/* --- Normalization & remap logic --- */
const lc = v => (v || '').toString().toLowerCase().trim();
const norm = v => (v || '').toString().trim();

function normalize(raw) {
  const it = {};
  it.id = raw.id || raw.name || (raw.title && lc(raw.title).replace(/\s+/g,'-')) || null;
  it.title = raw.title || raw.name || it.id || 'Untitled';
  it.category = raw.category || raw.Category || raw.group || 'Uncategorized';
  it.subcategory = raw.subcategory || raw.subCategory || raw.sub_cat || null;
  it.description = raw.description || raw.desc || '';
  it.image = (raw.hasOwnProperty('image') && raw.image === null) ? null : (raw.image || null);
  it.price = (typeof raw.price === 'number') ? raw.price : null;
  it.prices = raw.prices || null;
  it.variants = Array.isArray(raw.variants) ? raw.variants : null;
  it.available = (typeof raw.available === 'boolean') ? raw.available : true;
  it.raw = raw;
  return it;
}

// simple keyword heuristic map (extendable)
const keywordMap = [
  { kws: ['biryani'], cat: 'Biryani' },
  { kws: ['mandi'], cat: 'Mandi' },
  { kws: ['shawarma'], cat: 'Shawarma' },
  { kws: ['kebab','tikka','tandoori'], cat: 'Kebabs & Grills' },
  { kws: ['juice','shake','tea','coffee','beverage'], cat: 'Beverages' },
  { kws: ['tiffin','dosa','idli','sambar','rasam'], cat: 'Tiffin' },
  { kws: ['pizza','burger','sandwich'], cat: 'Continental' },
  { kws: ['chutney','raita','sauce'], cat: 'Chutneys' },
  // fallback keywords for Main Course-ish
  { kws: ['paneer','dal','masala','curry','mutton','chicken','fish','veg'], cat: 'Main Course' },
];

function heuristicCategory(item) {
  const hay = [item.id, item.title, item.subcategory, item.description].filter(Boolean).map(x => lc(x)).join(' ');
  for (const m of keywordMap) {
    for (const kw of m.kws) {
      if (hay.includes(kw)) return m.cat;
    }
  }
  return item.category || 'Uncategorized';
}

/* Build canonical with deterministic merging */
const byId = new Map();
for (const r of rawItems) {
  const n = normalize(r);
  if (!n.id) {
    // synth id from title
    n.id = lc(n.title).replace(/[^a-z0-9\-]+/g,'-').replace(/^\-+|\-+$/g,'');
  }
  if (byId.has(n.id)) {
    const prev = byId.get(n.id);
    // merge rules: keep existing non-null, otherwise take new
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

/* ---------------- APPLY OVERRIDES BEFORE SUSPECTS ---------------- */
// Load overrides if present and apply them to the byId entries.
// This ensures the report reflects overrides.
const OV_PATH = path.join(__dirname, 'overrides.json');
let overridesMap = null;
if (fs.existsSync(OV_PATH)) {
  try {
    const ov = JSON.parse(fs.readFileSync(OV_PATH, 'utf8'));
    overridesMap = new Map(ov.map(o => [o.id, o.category]));
    console.log('Loaded overrides:', overridesMap.size);
    // apply overrides onto byId entries
    for (const [id, item] of byId.entries()) {
      if (overridesMap.has(item.id)) {
        item._oldCategory = item.category;
        item.category = overridesMap.get(item.id);
      }
    }
  } catch (e) {
    console.error('Failed to load/parse overrides.json:', e.message);
    process.exit(4);
  }
} else {
  console.log('No overrides.json found — continuing without overrides.');
}
/* ---------------- END OVERRIDES ---------------- */

/* Apply biryani remap and gather suspects (computed after overrides applied) */
const canonical = [];
const suspects = [];
let movedToBiryani = 0;

for (const [id, item] of byId.entries()) {
  const hay = [item.id, item.title, item.subcategory, item.description].filter(Boolean).map(x => lc(x)).join(' ');
  const looksLikeBiryani = hay.includes('biryani') || hay.includes('dum-biryani') || /(^|[-_ ])biryani($|[-_ ])/i.test(item.id);
  if (looksLikeBiryani && item.category !== 'Biryani') {
    item._oldCategory = item._oldCategory || item.category;
    item.category = 'Biryani';
    movedToBiryani++;
  }

  const hcat = heuristicCategory(item);
  if (hcat && norm(hcat) !== norm(item.category)) {
    suspects.push({ id: item.id, title: item.title, current: item.category, heuristic: hcat });
  }

  canonical.push(item);
}

/* Sort and write outputs */
canonical.sort((a,b) => {
  const c = (a.category || '').localeCompare(b.category || '');
  return c !== 0 ? c : (a.title || '').localeCompare(b.title || '');
});

fs.writeFileSync(OUT_TMP, JSON.stringify(canonical, null, 2), 'utf8');

const report = {
  source: SRC,
  timestamp: new Date().toISOString(),
  total_items: canonical.length,
  moved_to_biryani: movedToBiryani,
  suspect_count: suspects.length,
  suspect_samples: suspects.slice(0, 50)
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');

console.log('WROTE TMP:', OUT_TMP);
console.log('WROTE REPORT:', REPORT);
console.log('SUMMARY:', report);
if (suspects.length) {
  console.log('\nSUSPECT SAMPLE (first 12):');
  console.table(suspects.slice(0,12));
}
console.log('\nNEXT: inspect TMP and REPORT. If OK, mv TMP -> client/src/data/menu.canonical.json (atomic replace).');
