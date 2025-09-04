import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GridNavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  showPrevious: boolean;
  showNext: boolean;
}

export function GridNavigationButtons({ onPrevious, onNext, showPrevious, showNext }: GridNavigationButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPrevious}
        disabled={!showPrevious}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center transition-all
          ${showPrevious 
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={onNext}
        disabled={!showNext}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center transition-all
          ${showNext 
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' 
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }
        `}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}