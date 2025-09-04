import React, { useState, useEffect } from 'react';
import { MenuCard } from './MenuCard';
import { MenuItem } from '@/data/mockData';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function MenuGrid({ items, onAddToCart, currentPage = 0, onPageChange }: MenuGridProps) {
  const itemsPerPage = 8; // 4x2 grid as specified
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Get items for current page
  const startIndex = currentPage * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="w-full px-3.5 py-0 relative">
      <div className="grid grid-cols-4 gap-[15px] w-full max-w-[393px]">
        {currentItems.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
          />
        ))}
        
        {/* Fill empty slots if needed */}
        {currentItems.length < itemsPerPage && 
          Array.from({ length: itemsPerPage - currentItems.length }).map((_, index) => (
            <div key={`empty-${index}`} className="w-20 h-[110px]" />
          ))
        }
      </div>

      {/* Page indicator (if more than one page) */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-1">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => onPageChange?.(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentPage ? 'bg-brand-teak w-4' : 'bg-gray-300'}
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}