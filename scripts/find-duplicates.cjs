const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "client", "src", "data", "menu.canonical.json");
const backup = file + ".bak";

// Make a backup
fs.copyFileSync(file, backup);

const text = fs.readFileSync(file, "utf8");
const arr = JSON.parse(text);

const seen = new Set();
const filtered = [];

for (const obj of arr) {
  if (!obj || !obj.id) {
    filtered.push(obj);
    continue;
  }
  if (seen.has(obj.id)) {
    console.log("Removed duplicate id:", obj.id);
    continue;
  }
  seen.add(obj.id);
  filtered.push(obj);
}

// Write cleaned file
fs.writeFileSync(file, JSON.stringify(filtered, null, 2), "utf8");

console.log("✅ Duplicates removed.");
console.log("📂 Backup saved at:", backup);
