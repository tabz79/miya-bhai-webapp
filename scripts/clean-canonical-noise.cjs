// scripts/clean-canonical-noise.cjs
// Run: node scripts/clean-canonical-noise.cjs

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const canonicalPath = path.join(repoRoot, 'client', 'src', 'data', 'menu.canonical.json');
const backupPath = canonicalPath + '.pre-clean.bak';

if (!fs.existsSync(canonicalPath)) {
  console.error('ERROR: canonical file not found at', canonicalPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));

function isNoiseName(name) {
  if (!name) return true;
  const raw = name.toString().trim().toLowerCase();
  // blacklist tokens (exact or containing)
  const blacklist = ['full','half','family','jumbo','extra','pc','pcs','4pc','6pc','8pc','serve','serves','piece','pieces','one','two','three','four','small','medium','large'];
  // immediate: short tokens or numeric-only
  if (/^[0-9]+$/.test(raw)) return true;
  if (raw.length <= 3) return true;
  // if name equals or contains a blacklist word and has very few alpha words, treat as noise
  const words = raw.split(/[^a-z0-9]+/).filter(Boolean);
  const alphaWords = words.filter(w => /[a-z]/.test(w));
  const hasBlack = words.some(w => blacklist.includes(w));
  if (hasBlack && alphaWords.length <= 1) return true;
  // if name is just a single word that is in blacklist-like set, drop
  if (words.length === 1 && blacklist.includes(words[0])) return true;
  // drop if it's just measurement tokens like '4pc' or '6pc' pattern
  if (/^\d+\s*pc$/.test(raw) || /^\d+\s*pcs$/.test(raw)) return true;
  // keep otherwise
  return false;
}

const removed = [];
const kept = [];

for (const item of data) {
  const name = (item.name || item.title || '').toString().trim();
  if (isNoiseName(name)) {
    removed.push({ id: item.id || null, name });
  } else {
    kept.push(item);
  }
}

// backup original
fs.copyFileSync(canonicalPath, backupPath);
fs.writeFileSync(canonicalPath, JSON.stringify(kept, null, 2), 'utf8');

console.log('CLEANUP COMPLETE');
console.log('Original backed up to:', backupPath);
console.log('Kept items:', kept.length);
console.log('Removed noisy items:', removed.length);
if (removed.length) {
  console.log('\nREMOVED (sample up to 50):');
  removed.slice(0,50).forEach(r => console.log('-', r.name));
}
