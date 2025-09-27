// scripts/upload-and-generate-map-from-csv.cjs
// Usage: node scripts/upload-and-generate-map-from-csv.cjs
// Expects .env to be present (CLOUDINARY_*). Reads CSV at CSV_MAP or default client/data/menu.csv
// Writes build/image-maps/dish-image-map.json and copies to client/src/data/images-map.json

require('dotenv').config();
const path = require('path');
const fs = require('fs-extra');
// use the exported sync parser entry-point
const { parse } = require('csv-parse/sync');
const slugify = require('slugify');

// p-limit CJS compatibility shim
const _pLimitPkg = require('p-limit');
const pLimit = (_pLimitPkg && _pLimitPkg.default) ? _pLimitPkg.default : _pLimitPkg;

const cloudinary = require('cloudinary').v2;

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const CSV_MAP = process.env.CSV_MAP || path.resolve('client/data/menu.csv');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve('client/assets/dishes'); // fallback if CSV has relative paths
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve('build/image-maps');
const COPY_TO_CLIENT = true;
const CLIENT_DEST = path.resolve('client/src/data/images-map.json');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10);
const DEFAULT_FOLDER = process.env.CLOUDINARY_FOLDER || 'miya_bhai/dishes';
const DEFAULT_TRANSFORM = 'f_auto,q_auto:good';

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary credentials. Ensure .env contains CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(2);
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET, secure: true });

function makeSlug(s) {
  if (!s) return null;
  return slugify(String(s), { lower: true, strict: true, trim: true }).slice(0, 200);
}

function buildVariants(publicId) {
  if (!publicId) return null;
  const id = encodeURIComponent(publicId).replace(/%2F/g, '/');
  const widths = { small: 320, medium: 640, large: 1024 };
  const variants = {};
  for (const [k, w] of Object.entries(widths)) {
    variants[k] = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${w},c_fill,${DEFAULT_TRANSFORM}/${id}`;
  }
  variants.original = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${DEFAULT_TRANSFORM}/${id}`;
  return variants;
}

async function readCsvMap(csvPath) {
  if (!await fs.pathExists(csvPath)) {
    throw new Error('CSV not found at ' + csvPath);
  }
  const raw = await fs.readFile(csvPath, 'utf8');
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  // Expect columns like: slug, local_image_path OR id,image OR title, imagePath
  const map = {};
  for (const r of records) {
    const keys = Object.keys(r);
    const slugKey = keys.find(k => /slug|id|key/i.test(k)) || keys[0];
    const pathKey = keys.find(k => /(path|image|file)/i.test(k)) || keys[1];
    const slugRaw = r[slugKey];
    const localRaw = r[pathKey];
    const slug = makeSlug(slugRaw) || makeSlug(path.basename(localRaw || ''));
    if (!slug) continue;
    const localResolved = localRaw && path.isAbsolute(localRaw) ? localRaw : path.resolve(path.dirname(csvPath), localRaw || '');
    map[slug] = localResolved;
  }
  return map;
}

async function checkRemote(public_id) {
  try {
    return await cloudinary.api.resource(public_id);
  } catch (err) {
    if (err && err.http_code === 404) return null;
    throw err;
  }
}

async function upload(localPath, public_id) {
  return cloudinary.uploader.upload(localPath, {
    public_id,
    folder: DEFAULT_FOLDER,
    overwrite: false,
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto',
    timeout: 120000
  });
}

(async () => {
  await fs.ensureDir(OUTPUT_DIR);
  const existingPath = path.join(OUTPUT_DIR, 'dish-image-map.json');
  let existing = {};
  if (await fs.pathExists(existingPath)) {
    try { existing = await fs.readJson(existingPath); } catch (e) { existing = {}; }
  }

  console.log('Reading CSV map from', CSV_MAP);
  const sourceMap = await readCsvMap(CSV_MAP);
  const limit = pLimit(CONCURRENCY);
  const results = {};
  const errors = [];

  await Promise.all(Object.entries(sourceMap).map(([slug, localPath]) => limit(async () => {
    try {
      // If file doesn't exist, mark and continue
      if (!localPath || !await fs.pathExists(localPath)) {
        results[slug] = { localPath, note: 'local_not_found' };
        return;
      }

      // prefer to reuse existing public_id if present
      if (existing[slug] && existing[slug].public_id) {
        results[slug] = { ...existing[slug], note: 'reused_existing' };
        return;
      }

      // candidate public_id - use folder + slug
      const public_id = `${DEFAULT_FOLDER}/${slug}`.replace(/^\/+/, '');

      // check remote
      let remote = null;
      try { remote = await checkRemote(public_id); } catch (e) { /* ignore transient */ }

      if (remote && remote.secure_url) {
        const entry = {
          localPath,
          public_id,
          url: remote.secure_url,
          width: remote.width,
          height: remote.height,
          bytes: remote.bytes,
          format: remote.format,
          uploaded_at: remote.created_at,
          note: 'exists_remote'
        };
        entry.variants = buildVariants(public_id);
        results[slug] = entry;
        return;
      }

      // upload
      const up = await upload(localPath, slug);
      const entry = {
        localPath,
        public_id: up.public_id || `${DEFAULT_FOLDER}/${slug}`,
        url: up.secure_url,
        width: up.width,
        height: up.height,
        bytes: up.bytes,
        format: up.format,
        uploaded_at: up.created_at,
        note: 'uploaded'
      };
      entry.variants = buildVariants(entry.public_id);
      results[slug] = entry;
    } catch (err) {
      errors.push({ slug, localPath, err: (err && err.message) || String(err) });
      results[slug] = { localPath, note: 'upload_failed', error: (err && err.message) || String(err) };
    }
  })));

  const final = { ...existing, ...results };
  await fs.writeJson(path.join(OUTPUT_DIR, 'dish-image-map.json'), final, { spaces: 2 });
  console.log('Wrote map to', path.join(OUTPUT_DIR, 'dish-image-map.json'), 'entries:', Object.keys(final).length);

  if (errors.length) {
    console.warn('Some uploads failed (see first 10):', errors.slice(0,10));
  }

  if (COPY_TO_CLIENT) {
    await fs.ensureDir(path.dirname(CLIENT_DEST));
    await fs.copy(path.join(OUTPUT_DIR, 'dish-image-map.json'), CLIENT_DEST);
    console.log('Copied map to', CLIENT_DEST);
  }

  console.log('Done. Run your app and verify three cases (cdn/local/placeholder).');
  process.exit(0);
})();
