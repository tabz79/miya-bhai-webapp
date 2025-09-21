// scripts/fix-menu-json.cjs
// Usage:
//   node scripts/fix-menu-json.cjs            # dry-run (report only)
//   node scripts/fix-menu-json.cjs --apply    # actually write changes
//   node scripts/fix-menu-json.cjs --apply --backup  # write + make a backup

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const filePath = path.join(repoRoot, 'client', 'src', 'data', 'menu.canonical.json');
const assetsDir = path.join(repoRoot, 'client', 'src', 'assets', 'raw');

function readJSONText(p) {
  return fs.readFileSync(p, 'utf8');
}

function tryParse(jsonText) {
  try {
    return { ok: true, data: JSON.parse(jsonText) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function normalizeImagePath(p) {
  if (!p || typeof p !== 'string') return p;
  // convert backslashes -> forward slashes, trim whitespace
  return p.trim().replace(/\\/g, '/');
}

function mergeObjectsKeepFirst(a, b) {
  // merge b into a, preferring non-null/defined values from a first
  const out = Object.assign({}, a);
  for (const k of Object.keys(b || {})) {
    if (out[k] === undefined || out[k] === null) out[k] = b[k];
  }
  return out;
}

function uniqueIdRename(existingIds, baseId) {
  // create baseId-v2, -v3... until unique
  let i = 2;
  while (existingIds.has(`${baseId}-v${i}`) || existingIds.has(`${baseId}-dup${i}`)) i++;
  return `${baseId}-v${i}`;
}

function run() {
  const args = process.argv.slice(2);
  const APPLY = args.includes('--apply');
  const BACKUP = args.includes('--backup');

  const text = readJSONText(filePath);
  const parse = tryParse(text);
  const report = {
    parsed: parse.ok,
    parseError: parse.ok ? null : String(parse.error),
    itemsBefore: null,
    itemsAfter: null,
    duplicatesFound: [],
    duplicatesResolved: [],
    imagesNormalized: 0,
    imagesWithBackslashes: [],
    missingImages: [],
    nestedRawIdFixed: []
  };

  if (!parse.ok) {
    console.error('ERROR: JSON parse failed:', parse.error.message || parse.error);
    console.error('Aborting. Fix syntax first or run with an editor.');
    process.exit(1);
  }

  const arr = parse.data;
  report.itemsBefore = arr.length;

  // normalize image paths and check asset presence
  const assets = new Set();
  if (fs.existsSync(assetsDir)) {
    for (const f of fs.readdirSync(assetsDir)) {
      assets.add(f);
    }
  }

  // detect duplicates (top-level)
  const idMap = new Map();
  arr.forEach((it, idx) => {
    const id = it && it.id ? String(it.id) : null;
    if (!idMap.has(id)) idMap.set(id, []);
    idMap.get(id).push(idx);
  });

  // Prepare unique result list
  const kept = [];
  const seen = new Set();

  for (let i = 0; i < arr.length; i++) {
    let item = arr[i];
    const id = item && item.id ? String(item.id) : null;

    // normalize image paths (both image and resolvedImage)
    ['image', 'resolvedImage'].forEach(key => {
      if (item && item[key]) {
        const old = item[key];
        const normalized = normalizeImagePath(String(old));
        if (old !== normalized) {
          item[key] = normalized;
          report.imagesNormalized++;
        }
        if (normalized.indexOf('\\') !== -1) {
          report.imagesWithBackslashes.push({id, value: normalized});
        }
        const filename = path.basename(normalized);
        if (!assets.has(filename)) report.missingImages.push({id, expected: normalized, filename});
      }
    });

    // nested raw.id handling: if item.raw?.id === item.id, make raw.id unique
    if (item && item.raw && item.raw.id && item.raw.id === id) {
      const newRawId = `${id}-raw`;
      item.raw.id = newRawId;
      report.nestedRawIdFixed.push({id, newRawId});
    }

    if (!id) {
      // no id: keep as-is (or you can choose to skip)
      kept.push(item);
      continue;
    }

    if (!seen.has(id)) {
      seen.add(id);
      kept.push(item);
    } else {
      // duplicate encountered - decide merge or rename - we will MERGE into first occurrence:
      const firstIndex = idMap.get(id)[0];
      const first = kept.find(o => o && o.id === id);
      // attempt to merge non-null fields from this duplicate into first
      const merged = mergeObjectsKeepFirst(first, item);
      // replace the 'first' in kept with merged
      for (let k = 0; k < kept.length; k++) {
        if (kept[k] && kept[k].id === id) {
          kept[k] = merged;
          break;
        }
      }
      report.duplicatesFound.push({id, duplicateIndex: i});
      report.duplicatesResolved.push({id, action: 'merged_into_first', mergedFromIndex: i});
      // do NOT add the duplicate object separately
    }
  }

  report.itemsAfter = kept.length;

  // Compose final JSON text
  const finalText = JSON.stringify(kept, null, 2);

  // If applying, optionally create backup and write file
  if (APPLY) {
    if (BACKUP) {
      const ts = (new Date()).toISOString().replace(/[:.]/g,'-');
      const backupPath = filePath + '.bak.' + ts;
      fs.writeFileSync(backupPath, text, 'utf8');
      console.log('Backup created at', backupPath);
    }
    fs.writeFileSync(filePath, finalText, 'utf8');
    console.log('Applied fixes to', filePath);
  } else {
    console.log('Dry run - no files written. Pass --apply to write changes.');
  }

  // Write a quick report to stdout
  console.log('--- REPORT ---');
  console.log(JSON.stringify(report, null, 2));
  // Also save report to disk next to script for manual review
  const reportPath = path.join(path.dirname(filePath), '..', 'reports', 'menu-fix-report.json');
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('Report saved to', reportPath);
  } catch (e) {
    // ignore
  }
}

run();
