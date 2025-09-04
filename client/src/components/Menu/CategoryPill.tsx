import React from 'react';

interface CategoryPillProps {
  category: string;
  isActive: boolean;
  onClick: () => void;
}

export function CategoryPill({ category, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        h-5 px-3 rounded-[53px] text-xs font-medium transition-all
        ${isActive 
          ? 'bg-brand-teak text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      {category}
    </button>
  );
}