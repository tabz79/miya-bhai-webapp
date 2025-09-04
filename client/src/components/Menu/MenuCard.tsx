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
    <div className="w-20 h-[110px] bg-white rounded-[18px] shadow-card flex flex-col overflow-hidden">
      {/* Image section - 80x82 */}
      <div className="w-20 h-[82px] relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {/* Add to cart button positioned over image */}
        <div className="absolute top-2 right-2">
          <AddToCartButton onAdd={handleAddToCart} size="sm" />
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 p-2 flex flex-col justify-between">
        <div>
          <h3 className="text-app-foreground text-xs font-medium leading-tight line-clamp-2">
            {item.name}
          </h3>
        </div>
        <p className="text-brand-teak text-xs font-semibold">₹{item.price}</p>
      </div>
    </div>
  );
}