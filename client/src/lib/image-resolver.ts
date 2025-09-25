/* image-resolver.ts
   Improved resolver:
   - safer Cloudinary URL builder (auto format, quality, optional transformations)
   - supports imagesMap entries with { url, public_id, variants, folder }
   - handles 'cloudinary:<public_id>' and 'cloudinary://folder/public_id' styles
   - exports helper to build responsive srcset
   - fails safely to placeholder
*/

import { slugify } from '@/lib/utils';
import imagesMap from '@/data/images-map.json';
import placeholderImage from '@/assets/placeholder-menu-item.png';

const CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME
  || import.meta.env?.VITE_CLOUD_NAME
  || null;

type ImageMapEntry = {
  url?: string;
  public_id?: string;
  folder?: string;
  variants?: Record<string, string>; // named variants -> url/public_id
  // any other fields are tolerated
  [k: string]: any;
};

const DEFAULT_TRANSFORM = 'f_auto,q_auto:good'; // auto format + auto quality

/** Normalize a raw public_id or cloudinary-style string to a clean public_id */
function normalizePublicId(raw?: string): string | null {
  if (!raw) return null;
  let pid = String(raw).trim();

  // common prefixes people may store
  if (pid.startsWith('cloudinary:')) pid = pid.replace(/^cloudinary:/i, '');
  if (pid.startsWith('cloudinary://')) pid = pid.replace(/^cloudinary:\/\//i, '');
  // strip leading slashes
  pid = pid.replace(/^\/+/, '');

  // if someone passed a full URL, try to extract public_id after /upload/
  try {
    if (pid.startsWith('http')) {
      const u = new URL(pid);
      const match = u.pathname.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) pid = decodeURIComponent(match[1]);
    }
  } catch (e) {
    // ignore URL parse errors
  }

  return pid || null;
}

/** Build Cloudinary URL with optional transformations (w,h,c, etc) appended before public_id */
export const buildCloudinaryUrl = (publicIdRaw?: string | null, transform = DEFAULT_TRANSFORM): string | null => {
  if (!publicIdRaw || !CLOUD_NAME) return null;
  const publicId = normalizePublicId(publicIdRaw);
  if (!publicId) return null;

  // ensure we don't accidentally double-encode slashes
  // Cloudinary expects folder/subfolder/.../public_id.ext (no leading slash)
  const encodedId = encodeURIComponent(publicId).replace(/%2F/g, '/');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${encodedId}`;
};

/** Build a srcset for responsive images. widths array in px (e.g. [320, 480, 768, 1024]) */
export const buildCloudinarySrcSet = (publicIdRaw: string | null, widths: number[] = [320, 480, 768, 1024]): string | null => {
  if (!publicIdRaw || !CLOUD_NAME) return null;
  const publicId = normalizePublicId(publicIdRaw);
  if (!publicId) return null;

  const parts = widths.map(w => {
    // transformation: set width, crop fill, keep default auto format/quality
    const t = `w_${w},c_fill,${DEFAULT_TRANSFORM}`;
    const url = buildCloudinaryUrl(publicId, t);
    return `${url} ${w}w`;
  });
  return parts.join(', ');
};

/** Try to find the image map entry for item. Accepts id, sku, slug(title) */
export const findImageEntry = (item: any): { key: string; entry: ImageMapEntry } | null => {
  if (!item) return null;
  const candidates: string[] = [];
  const title = item.title || item.name;

  if (item.id) candidates.push(String(item.id));
  if (item.sku) candidates.push(String(item.sku));
  if (title) candidates.push(slugify(title));

  // Also check raw filename if provided
  if (item.filename) candidates.push(item.filename);

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(imagesMap, key)) {
      return { key, entry: (imagesMap as any)[key] as ImageMapEntry };
    }
  }
  return null;
};

/** Resolve image to best possible URL (Cloudinary > absolute URL > local path > placeholder) */
export const resolveImage = (item: any): string => {
  if (!item) return placeholderImage;

  // 1) images-map
  const mapped = findImageEntry(item);
  if (mapped?.entry) {
    const e = mapped.entry;

    // If explicit URL present and looks like http(s), use it.
    if (typeof e.url === 'string' && /^https?:\/\//i.test(e.url)) return e.url;

    // If entry contains variants, try to pick 'cdn' -> 'large' -> first variant
    if (e.variants) {
      // prefer a variant that is a full URL, otherwise build Cloudinary URL from variant public_id
      const keysPrefer = ['cdn', 'large', 'default'];
      for (const k of keysPrefer) {
        if (e.variants[k]) {
          const v = e.variants[k];
          if (typeof v === 'string') {
            if (/^https?:\/\//i.test(v)) return v;
            const maybe = buildCloudinaryUrl(v);
            if (maybe) return maybe;
          } else if ((v as any).public_id) {
            const maybe = buildCloudinaryUrl((v as any).public_id);
            if (maybe) return maybe;
          }
        }
      }
      // fallback to first variant entry
      const first = Object.values(e.variants)[0];
      if (typeof first === 'string') {
        if (/^https?:\/\//i.test(first)) return first;
        const maybe = buildCloudinaryUrl(first);
        if (maybe) return maybe;
      } else if ((first as any).public_id) {
        const maybe = buildCloudinaryUrl((first as any).public_id);
        if (maybe) return maybe;
      }
    }

    // If entry has public_id, build cdn url
    if (e.public_id) {
      const url = buildCloudinaryUrl(e.public_id);
      if (url) return url;
    }

    // If entry has folder + id fields
    if (e.folder && e.public_id === undefined) {
      // attempt folder + mapped key
      const candidate = `${e.folder}/${mapped.key}`;
      const url = buildCloudinaryUrl(candidate);
      if (url) return url;
    }
  }

  // 2) item own fields (string or object)
  const imageField = item.imageUrl || item.image || item.image_url || item.photo || item.asset;
  if (typeof imageField === 'string') {
    if (/^https?:\/\//i.test(imageField)) return imageField;
    if (imageField.startsWith('/')) return imageField; // local public path
    // cloudinary alias string handling
    if (/^cloudinary[:\/]/i.test(imageField) || imageField.includes('/')) {
      const maybe = buildCloudinaryUrl(imageField);
      if (maybe) return maybe;
    }
  }

  if (typeof imageField === 'object' && imageField !== null) {
    // Accept either { url } or { public_id }
    if (typeof (imageField as any).url === 'string') {
      return (imageField as any).url;
    }
    if ((imageField as any).public_id) {
      const maybe = buildCloudinaryUrl((imageField as any).public_id);
      if (maybe) return maybe;
    }
  }

  // 3) Try to derive from title/slug as last-ditch (useful if public_id stored as folder/slug pattern)
  const title = item.title || item.name;
  if (title) {
    const guessed = slugify(title);
    // try imagesMap guessed key
    if (Object.prototype.hasOwnProperty.call(imagesMap, guessed)) {
      const e = (imagesMap as any)[guessed] as ImageMapEntry;
      if (e?.url) return e.url;
      if (e?.public_id) {
        const maybe = buildCloudinaryUrl(e.public_id);
        if (maybe) return maybe;
      }
    }
    // try cloudinary folder pattern: you may want to set default folder env var in future
    const maybe2 = buildCloudinaryUrl(guessed);
    if (maybe2) return maybe2;
  }

  // 4) fallback
  return placeholderImage;
};

/** Optional helper for components: returns { src, srcSet (nullable) } */
export const resolveImageSources = (item: any, withSrcSet = true) => {
  const src = resolveImage(item);
  let srcSet: string | null = null;

  // If src looks like cloudinary url, attempt to transform back to public_id (heuristic)
  if (src && CLOUD_NAME && src.includes(`/image/upload/`)) {
    // attempt to extract public_id and build a srcset
    try {
      const after = src.split('/image/upload/')[1];
      if (after) {
        // strip transforms if present (transform segment contains commas and underscores) -> find first slash then rest is public_id
        const parts = after.split('/');
        // join after any transform segments (detect transforms by presence of comma or equals or starting with 'w_','c_','f_')
        // simple heuristic: try last N parts; common case: transformSegment/public_id
        let publicId = after;
        // If there are known transform tokens (contain ',' or '=') in the first part, skip it.
        if (parts.length > 1 && /[,_=]/.test(parts[0])) {
          publicId = parts.slice(1).join('/');
        }
        srcSet = buildCloudinarySrcSet(decodeURIComponent(publicId));
      }
    } catch (e) {
      // silent
      srcSet = null;
    }
  }

  if (!withSrcSet) srcSet = null;
  return { src, srcSet };
};

export default {
  buildCloudinaryUrl,
  buildCloudinarySrcSet,
  findImageEntry,
  resolveImage,
  resolveImageSources,
};
