import React from 'react';
import { Bestseller } from '@/data/mockData';

interface BestSellerCardProps {
  item: Bestseller;
}

export function BestSellerCard({ item }: BestSellerCardProps) {
  return (
    <div className="flex-shrink-0 w-[60px] h-[100px] bg-white rounded-[95px] flex flex-col items-center justify-center gap-2 shadow-sm">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center px-1">
        <p className="text-white text-[10px] font-medium leading-tight">{item.name}</p>
        <p className="text-brand-teak text-[9px] font-semibold">₹{item.price}</p>
      </div>
    </div>
  );
}