import React from 'react';
import { Bestseller } from '@/data/mockData';

interface BestSellerCardProps {
  item: Bestseller;
}

export function BestSellerCard({ item }: BestSellerCardProps) {
  return (
    <div className="flex-shrink-0 w-[60px] h-[100px] bg-white rounded-[95px] flex flex-col items-center justify-center p-1 shadow-sm">
      {/* Image - centered in card */}
      <div className="w-8 h-8 rounded-full overflow-hidden mb-1">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Text content */}
      <div className="text-center px-1 flex-1 flex flex-col justify-center">
        <p className="text-gray-800 text-[8px] font-medium leading-tight mb-0.5 line-clamp-2">
          {item.name}
        </p>
        <p className="text-brand-teak text-[8px] font-semibold">₹{item.price}</p>
      </div>
    </div>
  );
}