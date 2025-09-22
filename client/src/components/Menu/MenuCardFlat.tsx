import React, { useState, useEffect, useRef } from 'react';
import { MenuItem } from '@/data/mockData';
import placeholderImage from '@/assets/placeholder-menu-item.png';
import AddToCartButton from '../AddToCartButton';

interface MenuCardProps {
  item: MenuItem & {
    resolvedImage?: string;
    title?: string;
    name?: string;
    price?: number | string;
    prices?: Record<string, any>;
    isVeg?: boolean | null;
  };
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

export default function MenuCardFlat({ item, onAddToCart }: MenuCardProps) {
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

  const fullDescription = (item.description || '').toString();
  const [expanded, setExpanded] = useState(false);

  // New: only show the "more" button when the description actually overflows 2 lines.
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [showMoreButton, setShowMoreButton] = useState(false);

  useEffect(() => {
    if (!fullDescription) {
      setShowMoreButton(false);
      return;
    }

    const el = descRef.current;
    if (!el) {
      setShowMoreButton(false);
      return;
    }

    const checkOverflow = () => {
      const clientH = el.clientHeight || 0;
      const scrollH = el.scrollHeight || 0;
      setShowMoreButton(scrollH > clientH + 1);
    };

    const rafId = requestAnimationFrame(checkOverflow);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(checkOverflow);
      });
      ro.observe(el);
      const parent = el.parentElement;
      if (parent) ro.observe(parent);
    } else {
      window.addEventListener('resize', checkOverflow);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) {
        try {
          ro.disconnect();
        } catch (e) {
          /* ignore */
        }
      } else {
        window.removeEventListener('resize', checkOverflow);
      }
    };
  }, [fullDescription, expanded]);

  const descriptionClass = expanded
    ? 'text-[13px] text-gray-600 mt-1 leading-snug'
    : 'text-[13px] text-gray-600 mt-1 leading-snug line-clamp-2';

  const renderVegMarker = () => {
    if (item.isVeg === true) {
      return (
        <span className="flex-none w-4 h-4 rounded-sm border-2 border-green-600 flex items-center justify-center" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-green-600" />
        </span>
      );
    }
    if (item.isVeg === false) {
      return (
        <span className="flex-none w-4 h-4 rounded-sm border-2 border-red-600 flex items-center justify-center" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-red-600" />
        </span>
      );
    }
    return <span className="flex-none w-4 h-4" aria-hidden />;
  };

  return (
    // subtle separator between cards using an inset box-shadow so it shows reliably on non-white backgrounds
    <article
      id={item.id}
      className="w-full bg-transparent"
      style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start py-2 px-0 min-h-[80px] gap-2">
        {renderVegMarker()}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Dish name — kept semibold, make it tighter and truncate to avoid wrap */}
              <h3 className="text-[16px] font-semibold text-colortextmenudishname truncate leading-tight">
                {dishName}
              </h3>

              {/* Description — compact */}
              {fullDescription ? (
                <p
                  ref={descRef}
                  className={`${descriptionClass} font-normal truncate`}
                  aria-label={`Description of ${dishName}`}
                  id={`desc-${item.id}-text`}
                >
                  {fullDescription}
                </p>
              ) : (
                <p className="text-[13px] text-gray-500 mt-1 font-normal truncate">Delicious & authentic.</p>
              )}

              {/* Price — tightened spacing */}
              <div className="text-[14px] font-semibold text-colortextmenuprice mt-1 leading-tight">
                {priceDisplay}
              </div>
            </div>

            {/* Image & add button aligned right, smaller to reduce card height */}
            <div className="flex flex-col items-end ml-3">
              <div className="w-20 h-20 flex-shrink-0 relative rounded-md overflow-hidden bg-gray-100">
                <img
                  src={imageSrc}
                  alt={dishName}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Add Button — kept small */}
              <div className="mt-2">
                <AddToCartButton
                  item={item}
                  onAddToCart={onAddToCart}
                  className="px-3 py-1 rounded-full text-[13px] font-semibold shadow-sm bg-green-500 text-white"
                />
              </div>
            </div>
          </div>

          {/* Expand/collapse description - show "more" only when overflow is detected */}
          {fullDescription && !expanded && showMoreButton && (
            <div className="mt-1">
              <button
                onClick={() => setExpanded(true)}
                className="text-[13px] font-medium text-gray-700"
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
                className="text-[13px] font-medium text-gray-700"
                aria-expanded={expanded}
                aria-controls={`desc-${item.id}`}
              >
                less
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
