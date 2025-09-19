#!/usr/bin/env node
/**
 * generate-image-overrides.cjs
 * Scan assets for matching images and produce image-overrides.json
 * Usage:
 *   node scripts/generate-image-overrides.cjs         # dry run (just generates overrides file)
 *   node scripts/generate-image-overrides.cjs --apply # also injects into menu.canonical.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CANONICAL = path.join(ROOT, "client", "src", "data", "menu.canonical.json");
const OUT_PATH = path.join(ROOT, "scripts", "image-overrides.json");

// folders to scan for images
const IMAGE_DIRS = [
  path.join(ROOT, "client", "src", "assets", "raw"),
  path.join(ROOT, "client", "public", "figmaAssets"),
  path.join(ROOT, "assets"),
];

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// load canonical menu
if (!fs.existsSync(CANONICAL)) {
  console.error("ERROR: canonical menu not found:", CANONICAL);
  process.exit(1);
}
const menu = JSON.parse(fs.readFileSync(CANONICAL, "utf8"));

// collect images
let images = [];
for (const dir of IMAGE_DIRS) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
    files.forEach(f => {
      images.push({ file: f, abs: path.join(dir, f), slug: slugify(f) });
    });
  }
}

// fuzzy match
const overrides = [];
for (const item of menu) {
  const idSlug = slugify(item.id);
  const titleSlug = slugify(item.title);
  const match = images.find(img => img.slug.includes(idSlug) || idSlug.includes(img.slug) || img.slug.includes(titleSlug));
  if (match) {
    overrides.push({
      id: item.id,
      resolvedImage: path.relative(ROOT, match.abs).replace(/\\/g, "/"),
    });
  }
}

// write overrides file
fs.writeFileSync(OUT_PATH, JSON.stringify(overrides, null, 2), "utf8");
console.log(`WROTE overrides: ${OUT_PATH} (${overrides.length} matches)`);

// apply if requested
if (process.argv.includes("--apply")) {
  let changed = 0;
  const ovMap = new Map(overrides.map(o => [o.id, o.resolvedImage]));
  menu.forEach(it => {
    if (ovMap.has(it.id)) {
      it.resolvedImage = ovMap.get(it.id);
      changed++;
    }
  });
  fs.writeFileSync(CANONICAL, JSON.stringify(menu, null, 2), "utf8");
  console.log(`Applied ${changed} overrides into canonical menu.`);
} else {
  console.log("Dry run only. Use --apply to inject into canonical menu.");
}
