
# Dev Agent Audit Report: Menu & Image Pipeline

**Date:** 2025-09-13

## 1. Executive Summary

The menu fails to render cards because of two critical, compounding issues. First, the logic intended to find images for menu items (`image-resolver.ts`) is guaranteed to fail due to a fundamental mismatch between the keys in the menu data (`id`, `sku`) and the keys in the image map (`name-slug`). Second, the main UI component (`Home.tsx`) then aggressively filters out any item for which an image wasn't found, resulting in an empty list being passed to the grid and a blank UI.

## 2. Key Evidence

**Evidence A: Aggressive Filtering in `Home.tsx`**

The component filters out any item that doesn't have a resolved image, instead of allowing it to render with a fallback. This is the direct cause of the empty UI.

- **File:** `client/src/pages/Home.tsx`
- **Lines:** `40-43`
```typescript
  const itemsWithImages = menu.map(item => ({
    ...item,
    resolvedImage: resolveImageForItem(item),
  })).filter(item => item.resolvedImage !== '/images/fallback-food.jpg');
```

**Evidence B: Flawed Key Lookup Strategy in `image-resolver.ts`**

The resolver looks for `item.id` and `item.sku` in the image map, but the map is keyed by name-slugs.

- **File:** `client/src/lib/image-resolver.ts`
- **Lines:** `16-25`
```typescript
  // 1. Try imagesMap[item.id]
  if (item.id && map[item.id]?.url) {
    return map[item.id].url!;
  }

  // 2. Try imagesMap[item.sku]
  if (item.sku && map[item.sku]?.url) {
    return map[item.sku].url!;
  }
```

**Evidence C: Mismatched Data Keys**

The canonical menu data uses UUIDs for `id`, while the image map uses slugs.

- **File:** `client/src/data/menu.canonical.json` (Item `id`)
```json
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
```

- **File:** `client/src/data/images-map.json` (Map key)
```json
  "classic-chicken-biryani": {
    "public_id": "...",
```

## 3. Root Causes

*   **P0 - Aggressive Filtering:** The primary bug is in `Home.tsx`. By filtering out every item that the resolver fails to match, it ensures that any data inconsistency leads to a blank screen. The UI should be tolerant and display a fallback image, not remove the card entirely.

*   **P0 - Incorrect Key Strategy:** The `image-resolver.ts` logic is fundamentally broken. It prioritizes lookups by `item.id` and `item.sku`, which will never match the slug-based keys present in `images-map.json`.

*   **P1 - Inconsistent Data Sources:** The item names in `menu.canonical.json` (e.g., "Classic Chicken Biryani") do not consistently produce the same slugs as the keys in `images-map.json` (e.g., `chicken-dum-biryani`). The data sources are not synchronized.

## 4. Prioritized Fixes

### P0: Immediate Fixes to Restore UI

1.  **Relax the Image Filter (Most Critical):**
    - **File:** `client/src/pages/Home.tsx`
    - **Action:** Remove the `.filter()` call to allow all items to be displayed, relying on the `MenuCard` to show a fallback image.
    - **Suggested Diff:**
      ```diff
      -  })).filter(item => item.resolvedImage !== '/images/fallback-food.jpg');
      +  }));
      ```

2.  **Correct the Resolver Key Order:**
    - **File:** `client/src/lib/image-resolver.ts`
    - **Action:** Prioritize the lookup that has a chance of succeeding (slug-based) before trying the others.
    - **Suggested Diff:**
      ```diff
      -
      // 1. Try imagesMap[item.id]
      if (item.id && map[item.id]?.url) { ... }
      // 2. Try imagesMap[item.sku]
      if (item.sku && map[item.sku]?.url) { ... }
      // 3. Try imagesMap[slug(item.name)]
      const slug = slugify(item.name);
      if (map[slug]?.url) { ... }
      +
      // 1. Try imagesMap[slug(item.name)]
      const slug = slugify(item.name);
      if (map[slug]?.url) {
        return map[slug].url!;
      }
      // 2. Try imagesMap[item.id]
      if (item.id && map[item.id]?.url) { ... }
      // 3. Try imagesMap[item.sku]
      if (item.sku && map[item.sku]?.url) { ... }
      ```

### P1/P2: Follow-up Fixes

*   **P1 - Unify Data Keys:** The most robust long-term solution is to make the keys consistent. Either regenerate `images-map.json` using a stable identifier from the menu data (like `id` or `sku`) as the key, or update the names in `menu.canonical.json` to match the image names.

*   **P2 - Improve Fallback UX:** Instead of relying on a broken image icon or a generic logo, create a styled placeholder component within `MenuCard` that displays when `resolveImageForItem` returns the final fallback URL. This provides a better user experience for missing images.

## 5. Human Verification Checklist

After applying the P0 fixes:

1.  [ ] **Run the application** (`npm run dev:client`).
2.  [ ] **Verify Home Page:** Confirm that the menu grid on the home page now populates with cards. Some may show the fallback logo, but they should no longer be filtered out.
3.  [ ] **Verify Pagination:** Confirm that if the total number of items in a category exceeds 8, the left/right pagination arrows reappear below the grid.
4.  [ ] **Check Console:** Ensure there are no new critical errors in the browser console related to data loading or rendering.

---
`APPENDED_BY: DevAgent Audit`
`APPEND_TIME: 2025-09-13T20:00:00Z`
