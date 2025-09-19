
// Defines a canonical order for menu categories to ensure consistent sorting.
export const CANONICAL_CATEGORY_ORDER: string[] = [
  "Starters",
  "Main Course",
  "Biryani",
  "Mandi",
  "Desserts",
  "Beverages",
];

/**
 * Sorts an array of category strings based on the canonical order.
 * Categories not in the canonical list will be placed at the end, sorted alphabetically.
 *
 * @param categories - An array of category strings.
 * @returns A new array with sorted categories.
 */
export function sortCategories(categories: string[]): string[] {
  const canonicalSet = new Set(CANONICAL_CATEGORY_ORDER);
  
  const sortedCanonical = CANONICAL_CATEGORY_ORDER.filter(cat => categories.includes(cat));
  
  const nonCanonical = categories
    .filter(cat => !canonicalSet.has(cat))
    .sort((a, b) => a.localeCompare(b));
    
  return [...sortedCanonical, ...nonCanonical];
}
