// scripts/apply-arabian-shawarma.cjs
// Usage: node scripts\apply-arabian-shawarma.cjs
const fs = require('fs');
const path = require('path');

const MENU_PATH = path.join(__dirname, '..', 'client', 'src', 'data', 'menu.canonical.json');

if (!fs.existsSync(MENU_PATH)) {
  console.error('ERROR: menu.canonical.json not found at', MENU_PATH);
  process.exit(1);
}

const raw = fs.readFileSync(MENU_PATH, 'utf8');
var data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('ERROR: Failed to parse JSON:', e.message);
  process.exit(2);
}

// data is expected to be an array
if (!Array.isArray(data)) {
  console.error('ERROR: Expected menu.canonical.json to be an array root.');
  process.exit(3);
}

var newMandiItems = [
  { id: "mandi-chicken-mini", title: "Chicken Mandi (Mini)", category: "Arabian", subcategory: "Chicken Mandi", prices: { mini: 250 }, image: null, tier: 2 },
  { id: "mandi-chicken-half", title: "Chicken Mandi (Half)", category: "Arabian", subcategory: "Chicken Mandi", prices: { half: 420 }, image: null, tier: 2 },
  { id: "mandi-chicken-3piece", title: "Chicken Mandi (3-piece)", category: "Arabian", subcategory: "Chicken Mandi", prices: { three_piece: 600 }, image: null, tier: 2 },
  { id: "mandi-chicken-full", title: "Chicken Mandi (Full)", category: "Arabian", subcategory: "Chicken Mandi", prices: { full: 750 }, image: null, tier: 2 },

  { id: "mandi-chicken-juicy-mini", title: "Chicken Juicy Mandi (Mini)", category: "Arabian", subcategory: "Chicken Juicy Mandi", prices: { mini: 320 }, image: null, tier: 2 },
  { id: "mandi-chicken-juicy-half", title: "Chicken Juicy Mandi (Half)", category: "Arabian", subcategory: "Chicken Juicy Mandi", prices: { half: 500 }, image: null, tier: 2 },
  { id: "mandi-chicken-juicy-3piece", title: "Chicken Juicy Mandi (3-piece)", category: "Arabian", subcategory: "Chicken Juicy Mandi", prices: { three_piece: 750 }, image: null, tier: 2 },
  { id: "mandi-chicken-juicy-full", title: "Chicken Juicy Mandi (Full)", category: "Arabian", subcategory: "Chicken Juicy Mandi", prices: { full: 1000 }, image: null, tier: 2 },

  { id: "mandi-broasted-mini", title: "Broasted Mandi (Mini)", category: "Arabian", subcategory: "Broasted Mandi", prices: { mini: 320 }, image: null, tier: 2 },
  { id: "mandi-broasted-half", title: "Broasted Mandi (Half)", category: "Arabian", subcategory: "Broasted Mandi", prices: { half: 500 }, image: null, tier: 2 },
  { id: "mandi-broasted-3piece", title: "Broasted Mandi (3-piece)", category: "Arabian", subcategory: "Broasted Mandi", prices: { three_piece: 750 }, image: null, tier: 2 },
  { id: "mandi-broasted-full", title: "Broasted Mandi (Full)", category: "Arabian", subcategory: "Broasted Mandi", prices: { full: 1000 }, image: null, tier: 2 },

  { id: "mandi-tandoori-half", title: "Tandoori Chicken Mandi (Half)", category: "Arabian", subcategory: "Tandoori Chicken Mandi", prices: { half: 440 }, image: null, tier: 2 },
  { id: "mandi-tandoori-full", title: "Tandoori Chicken Mandi (Full)", category: "Arabian", subcategory: "Tandoori Chicken Mandi", prices: { full: 800 }, image: null, tier: 2 },

  { id: "mandi-mutton-mini", title: "Nizami Mutton Mandi (Mini)", category: "Arabian", subcategory: "Mutton Mandi", prices: { mini: 320 }, image: null, tier: 2 },
  { id: "mandi-mutton-half", title: "Nizami Mutton Mandi (Half)", category: "Arabian", subcategory: "Mutton Mandi", prices: { half: 500 }, image: null, tier: 2 },
  { id: "mandi-mutton-3piece", title: "Nizami Mutton Mandi (3-piece)", category: "Arabian", subcategory: "Mutton Mandi", prices: { three_piece: 750 }, image: null, tier: 2 },
  { id: "mandi-mutton-full", title: "Nizami Mutton Mandi (Full)", category: "Arabian", subcategory: "Mutton Mandi", prices: { full: 900 }, image: null, tier: 2 },

  { id: "mandi-mutton-juice-mini", title: "Juicy Mutton Mandi (Mini)", category: "Arabian", subcategory: "Juicy Mutton Mandi", prices: { mini: 350 }, image: null, tier: 2 },
  { id: "mandi-mutton-juice-half", title: "Juicy Mutton Mandi (Half)", category: "Arabian", subcategory: "Juicy Mutton Mandi", prices: { half: 600 }, image: null, tier: 2 },
  { id: "mandi-mutton-juice-3piece", title: "Juicy Mutton Mandi (3-piece)", category: "Arabian", subcategory: "Juicy Mutton Mandi", prices: { three_piece: 850 }, image: null, tier: 2 },
  { id: "mandi-mutton-juice-full", title: "Juicy Mutton Mandi (Full)", category: "Arabian", subcategory: "Juicy Mutton Mandi", prices: { full: 1100 }, image: null, tier: 2 },

  { id: "mandi-special-mutton-half", title: "Special Mutton Masala Mandi (Half)", category: "Arabian", subcategory: "Special Mutton Masala", prices: { half: 700 }, image: null, tier: 2 },
  { id: "mandi-special-mutton-full", title: "Special Mutton Masala Mandi (Full)", category: "Arabian", subcategory: "Special Mutton Masala", prices: { full: 1300 }, image: null, tier: 2 },

  { id: "mandi-fish-half", title: "Fish Mandi (Half)", category: "Arabian", subcategory: "Fish Mandi", prices: { half: 460 }, image: null, tier: 2 },
  { id: "mandi-fish-full", title: "Fish Mandi (Full)", category: "Arabian", subcategory: "Fish Mandi", prices: { full: 850 }, image: null, tier: 2 },
  { id: "mandi-mix-4p", title: "Mix Mandi (4 members)", category: "Arabian", subcategory: "Mix Mandi", prices: { pack_for_4: 1100 }, image: null, tier: 2 },
];

function norm(s) { return (s || '').toString().toLowerCase(); }

var idSet = new Set(data.map(function(i){ return i.id; }));

// Reclassify mandi-like items
var reclassified = 0;
data = data.map(function(item){
  var id = norm(item.id);
  var title = norm(item.title || item.name);
  var sub = norm(item.subcategory || item.subCategory || '');
  var cat = norm(item.category || '');

  if ((id.indexOf('mandi') !== -1 || title.indexOf('mandi') !== -1 || sub.indexOf('mandi') !== -1) && cat !== 'arabian') {
    item._oldCategory = item.category || null;
    item.category = 'Arabian';
    reclassified++;
  }
  return item;
});

// Move shawarma items
var shawarmaMoved = 0;
data = data.map(function(item){
  var id = norm(item.id);
  var title = norm(item.title || item.name);
  var tags = norm(Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || ''));
  var cat = norm(item.category || '');

  if ((id.indexOf('shawarma') !== -1 || title.indexOf('shawarma') !== -1 || tags.indexOf('shawarma') !== -1) && cat !== 'shawarma') {
    item._oldCategory = item._oldCategory || item.category || null;
    item.category = 'Shawarma';
    shawarmaMoved++;
  }
  return item;
});

// Append new mandi items if missing
var appended = [];
newMandiItems.forEach(function(ni){
  if (!idSet.has(ni.id)) {
    var newItem = {
      id: ni.id,
      title: ni.title,
      category: ni.category,
      subcategory: ni.subcategory || ni.subCategory || null,
      description: ni.description || '',
      image: ni.image || null,
      price: ni.price || null,
      prices: ni.prices || null,
      variants: null,
      available: true,
      raw: Object.assign({}, ni),
    };
    data.push(newItem);
    appended.push(ni.id);
    idSet.add(ni.id);
  }
});

fs.writeFileSync(MENU_PATH, JSON.stringify(data, null, 2), 'utf8');

console.log('Done — modifications applied to:', MENU_PATH);
console.log('Reclassified mandi-like items to Arabian:', reclassified);
console.log('Moved shawarma-like items to Shawarma:', shawarmaMoved);
console.log('Appended new mandi IDs:', appended.length, appended.slice(0,20).join(', '));
