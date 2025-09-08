import React from 'react';

interface CarouselIndicatorsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export function CarouselIndicators({ total, current, onSelect }: CarouselIndicatorsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex w-9 h-[11px] items-center justify-center gap-[5px] px-[5px] py-[3px] absolute top-[180px] left-[260px] z-10">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`relative ${
            index === current 
              ? "w-[7px] h-[3px] bg-black rounded-md" 
              : "w-[3px] h-[3px] bg-black rounded-md"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}