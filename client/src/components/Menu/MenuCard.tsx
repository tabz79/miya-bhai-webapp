import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/data/mockData';
import placeholderImage from '@/assets/placeholder-menu-item.png';
import AddToCartButton from '../AddToCartButton'; // Assuming this component exists or will be created

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

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  const dishName =
    (item.title && String(item.title)) ||
    (item.name && String(item.name)) ||
    'Untitled';

  const [imageSrc, setImageSrc] = useState<string>(
    item.resolvedImage || item.image || placeholderImage
  );

  useEffect(() => {
    const candidate = item.resolvedImage || item.image || placeholderImage;
    if (candidate !== imageSrc) {
      setImageSrc(candidate);
    }
  }, [item.resolvedImage, item.image]);

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

  // Placeholder for description
  const description = item.description || 'A delicious and authentic dish.';

  return (
    <div className="flex items-center bg-white rounded-lg shadow-md p-2 mb-3 relative">
      {/* Left Section: Name, Description, Price */}
      <div className="flex-1 pr-2">
        <h3 className="font-bold text-lg text-gray-800">{dishName}</h3>
        <p className="text-sm text-gray-600 truncate">{description}</p>
        <p className="text-md font-semibold text-gray-900 mt-1">{priceDisplay}</p>
      </div>

      {/* Right Section: Image and Add Button */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <img
          src={imageSrc}
          alt={dishName}
          onError={handleImageError}
          className="w-full h-full object-cover rounded-md"
        />
        <AddToCartButton
          item={item}
          onAddToCart={onAddToCart}
          className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 text-xs"
        />
      </div>
    </div>
  );
}