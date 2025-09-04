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
    <div className="w-[80px] h-[110px] bg-white rounded-[18px] shadow-card flex flex-col overflow-hidden">
      {/* Image section - exact Figma specs: 80x82 */}
      <div className="w-[80px] h-[82px] relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {/* Add to cart button positioned over image */}
        <div className="absolute top-1 right-1">
          <AddToCartButton onAdd={handleAddToCart} size="sm" />
        </div>
      </div>

      {/* Content section - exact 28px remaining height */}
      <div className="h-[28px] p-1 flex flex-col justify-between">
        <h3 className="text-app-foreground text-[10px] font-medium leading-tight line-clamp-1 mb-0.5">
          {item.name}
        </h3>
        <p className="text-brand-teak text-[9px] font-semibold">₹{item.price}</p>
      </div>
    </div>
  );
}