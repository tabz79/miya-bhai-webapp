import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/data/mockData';
import placeholderImage from '@/assets/placeholder-menu-item.png';

interface MenuCardProps {
  item: MenuItem & { resolvedImage?: string; title?: string; name?: string; price?: number | string };
  onAddToCart: (item: MenuItem) => void;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.resolvedImage, item.image]);

  const handleAddToCart = () => onAddToCart(item);

  const handleImageError = () => {
    if (imageSrc !== placeholderImage) setImageSrc(placeholderImage);
  };

  const priceDisplay =
    item.price !== undefined && item.price !== null ? `₹${item.price}` : '';

  return (
    <div className="w-20 h-[110px] rounded-[18px] bg-colorsurfacemenucard shadow-effect-shadow-menucard border-0 relative overflow-hidden">
      {/* Dish image — full width, fixed height, rounded corners */}
      <div className="w-20 h-[82px] flex items-center justify-center">
        <img
          src={imageSrc}
          alt={dishName}
          onError={handleImageError}
          className="w-full h-full object-cover object-center rounded-[18px]"
        />
      </div>

      {/* Bottom band (still inside card, stays rectangular but inside rounded card) */}
      <div className="absolute left-0 top-[84px] w-20 h-[26px] bg-white rounded-b-[18px]">
        <div className="w-full h-full flex flex-col justify-between px-1 py-[2px]">
          {/* Row 1: dish name */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-[length:var(--typography-menu-dishname-font-size)] font-typography-menu-dishname text-colortextmenudishname truncate text-center"
              title={dishName}
              style={{ lineHeight: '1' }}
            >
              {dishName}
            </div>
          </div>

          {/* Row 2: price + add button */}
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
