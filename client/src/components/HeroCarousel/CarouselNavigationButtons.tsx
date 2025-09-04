import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselNavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  total: number;
}

export function CarouselNavigationButtons({ onPrevious, onNext, total }: CarouselNavigationButtonsProps) {
  if (total <= 1) return null;

  return (
    <>
      {/* Previous button */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 text-gray-700" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </button>
    </>
  );
}