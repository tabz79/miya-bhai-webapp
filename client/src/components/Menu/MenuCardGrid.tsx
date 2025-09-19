import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/data/mockData';
import placeholderImage from '@/assets/placeholder-menu-item.png';

interface MenuCardProps {
  item: MenuItem & { resolvedImage?: string; title?: string; name?: string; price?: number | string; prices?: Record<string, any> };
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

const resolvePriceFromPrices = (prices?: Record<string, any>) => {
  if (!prices || typeof prices !== 'object') return null;
  const pref = ['mini', 'half', 'three_piece', 'threepiece', 'full', 'pack_for_4', 'pack_for_2', 'pack_for_1'];
  const keys = Object.keys(prices || {});
  for (const p of pref) {
    const found = keys.find(k => k.toLowerCase().replace(/[-\s]/g, '') === p);
    if (found && prices[found] != null && !isNaN(Number(prices[found]))) {
      return { value: Number(prices[found]), label: found };
    }
  }
  for (const k of keys) {
    const v = prices[k];
    if (v != null && !isNaN(Number(v))) return { value: Number(v), label: k };
  }
  return null;
};

const humanizeLabel = (label?: string) => {
  if (!label) return '';
  return label.replace(/[_-]/g, ' ').toLowerCase();
};

function MenuCardGrid({ item, onAddToCart }: MenuCardProps) {
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

  const handleAddToCart = () => onAddToCart(item);

  const handleImageError = () => {
    if (imageSrc !== placeholderImage) setImageSrc(placeholderImage);
  };

  let priceDisplay = '';
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    priceDisplay = formatPrice(item.price);
  } else if (item.prices) {
    const picked = resolvePriceFromPrices(item.prices);
    if (picked) {
      const label = humanizeLabel(picked.label);
      priceDisplay = `${formatPrice(picked.value)}${label ? ` (${label})` : ''}`;
    } else {
      priceDisplay = '';
    }
  } else {
    priceDisplay = '';
  }

  return (
    <div className="w-20 h-[110px] rounded-[18px] bg-colorsurfacemenucard shadow-effect-shadow-menucard border-0 relative overflow-hidden">
      <div className="w-20 h-[82px] flex items-center justify-center">
        <img
          src={imageSrc}
          alt={dishName}
          onError={handleImageError}
          className="w-full h-full object-cover object-center rounded-[18px]"
        />
      </div>

      <div className="absolute left-0 top-[84px] w-20 h-[26px] bg-white rounded-b-[18px]">
        <div className="w-full h-full flex flex-col justify-between px-1 py-[2px]">
          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-[length:var(--typography-menu-dishname-font-size)] font-typography-menu-dishname text-colortextmenudishname truncate text-center"
              title={dishName}
              style={{ lineHeight: '1' }}
            >
              {dishName}
            </div>
          </div>

          <div className="flex items-center justify-between w-full mt-0">
            <div className="text-[length:var(--typography-menu-price-font-size)] font-typography-menu-price text-colortextmenuprice whitespace-nowrap pl-1">
              {priceDisplay}
            </div>

            <button
              onClick={handleAddToCart}
              aria-label={`Add ${dishName} to cart`}
              className="w-[18px] h-[18px] p-0 bg-transparent border-0 flex items-center justify-center pr-1"
            >
              <img
                className="w-[18px] h-[18px]"
                alt="Add to cart"
                src="/figmaAssets/add-to-cart-button.svg"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuCardGrid;
