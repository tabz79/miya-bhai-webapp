import React from 'react';
import { MenuItem } from '@/data/mockData';
import { AddToCartButton } from '../AddToCartButton';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  const handleAddToCart = () => {
    onAddToCart(item);
  };

  return (
    <div className="w-20 h-[110px] bg-colorsurfacemenucard rounded-[18px] overflow-hidden shadow-effect-shadow-menucard border-0">
      <div className="p-0 relative w-full h-full">
        {/* Image section - exact Figma positioning */}
        <div className="flex flex-col w-20 h-[82px] items-center justify-center gap-2.5 p-2.5 absolute top-0 left-0 bg-white">
          <img
            className="relative w-20 h-[82px] mt-[-10.00px] mb-[-10.00px] ml-[-10.00px] mr-[-10.00px] object-cover"
            alt={item.name}
            src={item.image}
          />
        </div>

        {/* Content section - exact Figma positioning */}
        <div className="w-20 h-[26px] top-[84px] absolute left-0">
          <div className="absolute w-20 h-[26px] top-0 left-0">
            <div className="flex w-20 items-center justify-center gap-2.5 p-px absolute top-0 left-0">
              <div className="relative flex-1 mt-[-1.00px] font-typography-menu-dishname font-[number:var(--typography-menu-dishname-font-weight)] text-colortextmenudishname text-[length:var(--typography-menu-dishname-font-size)] text-center tracking-[var(--typography-menu-dishname-letter-spacing)] leading-[var(--typography-menu-dishname-line-height)] [font-style:var(--typography-menu-dishname-font-style)]">
                {item.name}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="absolute w-[18px] h-[18px] top-2 left-[47px] p-0 h-auto bg-transparent border-0"
            >
              <img
                className="w-[18px] h-[18px]"
                alt="Add to cart button"
                src="/figmaAssets/add-to-cart-button.svg"
              />
            </button>
          </div>

          <div className="inline-flex items-center justify-center gap-2.5 absolute top-3 left-[22px]">
            <div className="relative w-fit mt-[-1.00px] font-typography-menu-price font-[number:var(--typography-menu-price-font-weight)] text-colortextmenuprice text-[length:var(--typography-menu-price-font-size)] text-center tracking-[var(--typography-menu-price-letter-spacing)] leading-[var(--typography-menu-price-line-height)] whitespace-nowrap [font-style:var(--typography-menu-price-font-style)]">
              ₹{item.price}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}