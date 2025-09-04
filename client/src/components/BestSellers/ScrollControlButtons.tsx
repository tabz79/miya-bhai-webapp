import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollControlButtonsProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
  showLeft: boolean;
  showRight: boolean;
}

export function ScrollControlButtons({ onScrollLeft, onScrollRight, showLeft, showRight }: ScrollControlButtonsProps) {
  return (
    <>
      {/* Left scroll button */}
      {showLeft && (
        <button
          onClick={onScrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>
      )}

      {/* Right scroll button */}
      {showRight && (
        <button
          onClick={onScrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      )}
    </>
  );
}