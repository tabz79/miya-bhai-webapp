// scripts/build-canonical-advanced.cjs
// Node/CommonJS. Run: node scripts/build-canonical-advanced.cjs
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const menuTxtPath = path.join(repoRoot, 'menu.txt');
const dishesTxtPath = path.join(repoRoot, 'dish-names.txt');
const outPath = path.join(repoRoot, 'client', 'src', 'data', 'menu.canonical.json');
const reportPath = path.join(repoRoot, 'client', 'src', 'data', 'mapping-report.json');

if (!fs.existsSync(menuTxtPath)) {
  console.error('menu.txt not found at', menuTxtPath); process.exit(1);
}
if (!fs.existsSync(dishesTxtPath)) {
  console.error('dish-names.txt not found at', dishesTxtPath); process.exit(1);
}

const rawMenu = fs.readFileSync(menuTxtPath, 'utf8');
const rawDishes = fs.readFileSync(dishesTxtPath, 'utf8');

const dishFiles = rawDishes.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

// normalization helpers
function normalizeForMatch(s){
  if(!s) return '';
  // remove parentheses and their contents
  let t = s.replace(/\([^)]*\)/g, ' ');
  // remove common tokens
  t = t.replace(/\b(mini|half|full|family|extra|pc|pcs|serve|serves|piece|pieces|4pc|6pc|8pc)\b/gi,' ');
  // remove hyphenated counts like '- 6pc'
  t = t.replace(/-\s*\d+\s*pc/gi, ' ');
  // remove slashes and variants like 'One/Peas'
  t = t.replace(/[\/\\]/g,' ');
  // remove special chars, multiple spaces
  t = t.replace(/[^a-z0-9 ]+/gi,' ').replace(/\s+/g,' ').trim();
  return t.toLowerCase();
}

function slugify(s){
  return (s||'').toString().normalize ? s.normalize('NFKD').replace(/[\u0300-\u036F]/g,'') : s;
}
function toSlugKey(s){
  return slugify(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'');
}

// build dish key map
const dishMap = {};
for(const f of dishFiles){
  const nameOnly = f.replace(/\.[^.]+$/,'').trim();
  const key = toSlugKey(nameOnly);
  dishMap[key] = f;
}

// parse menu.txt for blocks (same naive approach)
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
if(blocks.length===0){
  const parts = rawMenu.split(/},\s*\n/);
  for(const p of parts) {
    if (p.includes('id') || p.includes('title') || p.includes('name')) blocks.push(p + '\n}');
  }
}

function getField(block, key){
  const re = new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}
function getNumber(block, key){
  const m = block.match(new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'));
  return m ? Number(m[1]) : null;
}

const items = blocks.map(b=>{
  const id = getField(b,'id') || getField(b,'name') || null;
  const title = getField(b,'title') || getField(b,'name') || id || null;
  const category = getField(b,'category') || getField(b,'subcategory') || null;
  const price = getNumber(b,'price') || null;
  return { id, title, category, price, raw: b };
}).filter(it => it.title);

const normalizeName = (name) => {
  // apply the normalization chain: strip parentheses, small tokens, numeric suffixes
  const n1 = normalizeForMatch(name);
  // further remove leading/trailing short tokens
  return n1.replace(/^\d+\s*/,'').trim();
};

// fuzzy/token score (number of shared tokens)
function tokenScore(a,b){
  const ta = Array.from(new Set(a.split(/\s+/).filter(Boolean)));
  const tb = Array.from(new Set(b.split(/\s+/).filter(Boolean)));
  let score=0;
  for(const t of ta) if(tb.includes(t)) score++;
  return score;
}

// matching
const exactMatches = [];
const approxMatches = [];
const unmatched = [];

const canonical = items.map(it=>{
  const name = it.title.trim();
  const cleaned = normalizeName(name);
  const slug = toSlugKey(cleaned);
  let matchedFile = null;
  let method=null, score=0;

  // exact slug match
  if(dishMap[slug]) { matchedFile = dishMap[slug]; method='slug_exact'; score=cleaned.split(' ').length; }
  // menu/<slug>
  if(!matchedFile && dishMap['menu/'+slug]) { matchedFile = dishMap['menu/'+slug]; method='menu_slash'; score=cleaned.split(' ').length; }
  // basename exact
  if(!matchedFile){
    for(const k of Object.keys(dishMap)){
      const basename = k.split('/').pop();
      if(basename === slug){ matchedFile = dishMap[k]; method='basename_exact'; score=cleaned.split(' ').length; break; }
    }
  }
  // token-best
  if(!matchedFile){
    let best=null, bestScore=0;
    for(const k of Object.keys(dishMap)){
      const s = k.replace(/[^a-z0-9]+/g,' ').trim();
      const sc = tokenScore(cleaned, s);
      if(sc>bestScore){ bestScore=sc; best=k; }
    }
    if(bestScore>0){ matchedFile = dishMap[best]; method='token_best'; score=bestScore; }
  }

  if(matchedFile){
    if(method==='slug_exact' || method==='basename_exact' || method==='menu_slash'){
      exactMatches.push({name, file: matchedFile, method});
    } else {
      approxMatches.push({name, file: matchedFile, method, score});
    }
  } else {
    unmatched.push({name});
  }

  return {
    id: it.id || toSlugKey(name),
    name,
    category: it.category || 'Uncategorized',
    price: it.price || null,
    imageUrl: matchedFile ? `/src/assets/raw/${matchedFile}` : null,
    _match: matchedFile ? { file: matchedFile, method, score } : null
  };
});

// backup existing out if exists
if(fs.existsSync(outPath)) fs.copyFileSync(outPath, outPath+'.bak');

// write out canonical
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(canonical, null, 2), 'utf8');

// write report
const report = {
  totalItems: items.length,
  matched: exactMatches.length + approxMatches.length,
  exactMatches: exactMatches,
  approxMatches: approxMatches,
  unmatched: unmatched
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`Wrote ${canonical.length} items to ${outPath}`);
console.log(`Matched: ${exactMatches.length + approxMatches.length} Unmatched: ${unmatched.length}`);
if(exactMatches.length) { console.log('\nEXACT MATCHES (sample):'); exactMatches.slice(0,10).forEach(m=>console.log('-', m.name, '->', m.file)); }
if(approxMatches.length) { console.log('\nAPPROX MATCHES (please review):'); approxMatches.slice(0,20).forEach(m=>console.log('-', m.name, '->', m.file, 'score:', m.score)); }
if(unmatched.length) { console.log('\nUNMATCHED (sample):'); unmatched.slice(0,20).forEach(u=>console.log('-', u.name)); }

console.log(`Report saved to ${reportPath}`);
