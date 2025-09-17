import React, { useState, useEffect, useRef } from 'react';
import { MenuCard } from './MenuCard';
import { MenuItem } from '@/data/mockData';

interface MenuGridProps {
  items: (MenuItem & { resolvedImage: string })[];
  onAddToCart: (item: MenuItem) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  paginate?: boolean;
}

export function MenuGrid({ items, onAddToCart, currentPage = 0, onPageChange, paginate = true }: MenuGridProps) {
  const itemsPerPage = 8; // 4x2 grid
  const totalPages = paginate ? Math.ceil(items.length / itemsPerPage) : 1;
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => onPageChange?.(Math.max(0, currentPage - 1));
  const handleNext = () => onPageChange?.(Math.min(totalPages - 1, currentPage + 1));

  useEffect(() => {
    if (!paginate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === gridRef.current) {
        if (e.key === 'ArrowLeft') {
          handlePrev();
        }
        if (e.key === 'ArrowRight') {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, paginate]);

  const currentItems = paginate ? items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage) : items;

  return (
    <section
      ref={gridRef}
      tabIndex={0}
      className="w-full px-3.5 py-0 relative focus:outline-none"
      aria-label="Menu Grid"
    >
      <div className="flex flex-col gap-[15px] w-full max-w-[393px]">
        {currentItems.map((item) => (
          <MenuCard key={item.id} item={item} onAddToCart={onAddToCart} />
        ))}
        {paginate && currentItems.length < itemsPerPage &&
          Array.from({ length: itemsPerPage - currentItems.length }).map((_, index) => (
            <div key={`empty-${index}`} className="w-20 h-[110px]" />
          ))}
      </div>

      {paginate && totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button onClick={handlePrev} disabled={currentPage === 0} className="disabled:opacity-50">
            &lt;
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => onPageChange?.(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentPage ? 'bg-brand-teak w-4' : 'bg-gray-300'}`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          <button onClick={handleNext} disabled={currentPage >= totalPages - 1} className="disabled:opacity-50">
            &gt;
          </button>
        </div>
      )}
    </section>
  );
}
