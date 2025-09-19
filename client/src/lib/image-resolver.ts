import imagesMap from '@/data/images-map.json';
import { MenuItem } from '@/data/mockData'; // Using this type for now

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

const getBasename = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
}

export const resolveImageForItem = (item: MenuItem): string => {
  const map = imagesMap as Record<string, { public_id: string, url?: string }>;

  // 1. Try imagesMap[slug(item.name)]
  const slug = slugify(item.name);
  if (map[slug]?.url) {
    return map[slug].url!;
  }

  // 2. Try imagesMap[item.id]
  if (item.id && map[item.id]?.url) {
    return map[item.id].url!;
  }

  // 3. Try imagesMap[item.sku]
  if (item.sku && map[item.sku]?.url) {
    return map[item.sku].url!;
  }

  // 4. Try imagesMap[basename(item.imageUrl || item.image || item.image_url)]
  const legacyImage = (item as any).imageUrl || item.image || (item as any).image_url;
  if (legacyImage) {
      const basename = getBasename(legacyImage);
      if (map[basename]?.url) {
          return map[basename].url!;
      }
  }

  // 5. Fallback to item's own image fields
  if (legacyImage) {
    return legacyImage;
  }

  // 6. Final fallback
  return '/images/fallback-food.jpg';
};
