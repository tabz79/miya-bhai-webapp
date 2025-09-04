import React from 'react';

interface CarouselIndicatorsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export function CarouselIndicators({ total, current, onSelect }: CarouselIndicatorsProps) {
  if (total <= 1) return null;

  const paginationDots = [
    {
      className: index === 0 && current === 0 
        ? "w-1 h-1 bg-[#ffffff01] rounded-[18px] shadow-[0px_0px_0px_1px_#007a4b]"
        : "w-[3px] h-[3px] bg-black rounded-md",
    },
    { className: index === 1 && current === 1 ? "w-[7px] h-[3px] bg-black rounded-md" : "w-[3px] h-[3px] bg-black rounded-md" },
    { className: index === 2 && current === 2 ? "w-[7px] h-[3px] bg-black rounded-md" : "w-[3px] h-[3px] bg-black rounded-md" },
  ];

  return (
    <div className="flex w-9 h-[11px] items-center justify-center gap-[5px] px-[5px] py-[3px] absolute top-[180px] left-[260px]">
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