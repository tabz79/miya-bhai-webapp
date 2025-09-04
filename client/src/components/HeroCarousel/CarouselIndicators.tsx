import React from 'react';

interface CarouselIndicatorsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export function CarouselIndicators({ total, current, onSelect }: CarouselIndicatorsProps) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${index === current ? 'bg-brand-teak w-4' : 'bg-gray-300'}
          `}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}