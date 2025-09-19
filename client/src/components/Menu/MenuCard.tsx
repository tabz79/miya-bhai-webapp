import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/data/mockData';
import placeholderImage from '@/assets/placeholder-menu-item.png';
import AddToCartButton from '../AddToCartButton';

interface MenuCardProps {
  item: MenuItem & { resolvedImage?: string; title?: string; name?: string; price?: number | string; prices?: Record<string, any>; isVeg?: boolean | null };
  onAddToCart: (item: MenuItem) => void;
}

const formatPrice = (p?: number | string) => {
  if (p == null || p === '') return '';
  const n = typeof p === 'string' ? Number(p) : p;
  if (!isFinite(n)) return '';
  if (Number.isInteger(n)) return `₹${n}`;
  const fixed = n.toFixed(2);
  return `₹${fixed.replace(/\.00$|(\.\d)0$/, '$1')}`;
};

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  const dishName =
    (item.title && String(item.title)) ||
    (item.name && String(item.name)) ||
    (item.raw?.name && String(item.raw.name)) ||
    'Untitled';

  const [imageSrc, setImageSrc] = useState<string>(
    item.resolvedImage || item.image || placeholderImage
  );

  useEffect(() => {
    const candidate = item.resolvedImage || item.image || placeholderImage;
    if (candidate !== imageSrc) {
      setImageSrc(candidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.resolvedImage, item.image]);

  const handleImageError = () => {
    if (imageSrc !== placeholderImage) setImageSrc(placeholderImage);
  };

  // price resolution (same as before)
  let priceDisplay = '';
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    priceDisplay = formatPrice(item.price);
  } else if (item.prices) {
    const keys = Object.keys(item.prices || {});
    const pref = ['mini', 'half', 'three_piece', 'threepiece', 'full', 'pack_for_4', 'pack_for_2', 'pack_for_1'];
    let picked: any = null;
    for (const p of pref) {
      const found = keys.find(k => k.toLowerCase().replace(/[-\s]/g, '') === p);
      if (found && item.prices[found] != null && !isNaN(Number(item.prices[found]))) {
        picked = { value: Number(item.prices[found]), label: found };
        break;
      }
    }
    if (!picked) {
      for (const k of keys) {
        const v = item.prices[k];
        if (v != null && !isNaN(Number(v))) {
          picked = { value: Number(v), label: k };
          break;
        }
      }
    }
    if (picked) {
      const label = picked.label ? ` (${picked.label.replace(/[_-]/g, ' ')})` : '';
      priceDisplay = `${formatPrice(picked.value)}${label}`;
    }
  }

  // description: allow 2-line clamp with "more" toggle
  const fullDescription = (item.description || '').toString();
  const [expanded, setExpanded] = useState(false);
  const showMoreNeeded = fullDescription && fullDescription.split(/\s+/).length > 10; // heuristic; still show toggle if long
  const descriptionClass = expanded ? 'text-sm text-gray-600 mt-1' : 'text-sm text-gray-600 mt-1 line-clamp-2';

  // veg / non-veg indicator handling
  // Data contract: item.isVeg === true (veg), === false (non-veg), undefined => no marker
  const renderVegMarker = () => {
    if (item.isVeg === true) {
      return (
        <span className="flex-none w-5 h-5 rounded-sm border-2 border-green-600 flex items-center justify-center mr-3" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
        </span>
      );
    }
    if (item.isVeg === false) {
      return (
        <span className="flex-none w-5 h-5 rounded-sm border-2 border-red-600 flex items-center justify-center mr-3" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
        </span>
      );
    }
    // placeholder (invisible space to keep alignment)
    return <span className="flex-none w-5 h-5 mr-3" aria-hidden />;
  };

  return (
    <article className="w-full bg-transparent">
      <div className="flex items-start gap-3 py-3 px-2">
        {/* Left: veg marker + content */}
        <div className="flex items-start">
          {renderVegMarker()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 leading-5 truncate">{dishName}</h3>
              {fullDescription ? (
                <p className={descriptionClass} aria-label={`Description of ${dishName}`}>
                  {fullDescription}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Delicious & authentic.</p>
              )}
              <div className="text-sm font-medium text-gray-900 mt-2">{priceDisplay}</div>
            </div>

            {/* Right: image + ADD button */}
            <div className="flex flex-col items-end ml-3">
              <div className="w-28 h-28 flex-shrink-0 relative rounded-md overflow-hidden">
                <img
                  src={imageSrc}
                  alt={dishName}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-2">
                <AddToCartButton
                  item={item}
                  onAddToCart={onAddToCart}
                  className="px-3 py-1 rounded-full text-sm font-semibold shadow-md bg-green-500 text-white"
                />
              </div>
            </div>
          </div>

          {/* "more" toggle */}
          {fullDescription && !expanded && (
            <div className="mt-1">
              <button
                onClick={() => setExpanded(true)}
                className="text-sm font-medium text-gray-700"
                aria-expanded={expanded}
                aria-controls={`desc-${item.id}`}
              >
                more
              </button>
            </div>
          )}
          {expanded && fullDescription && (
            <div id={`desc-${item.id}`} className="mt-2">
              <button
                onClick={() => setExpanded(false)}
                className="text-sm font-medium text-gray-700"
                aria-expanded={expanded}
                aria-controls={`desc-${item.id}`}
              >
                less
              </button>
            </div>
          )}
        </div>
      </div>

      {/* subtle divider handled by MenuGrid via divide-y; keep small bottom padding */}
    </article>
  );
}
