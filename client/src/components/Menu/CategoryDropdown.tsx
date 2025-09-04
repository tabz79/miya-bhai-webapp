import React from 'react';

interface CategoryDropdownProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isOpen: boolean;
}

export function CategoryDropdown({ categories, selectedCategory, onSelectCategory, isOpen }: CategoryDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`
            w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors
            ${selectedCategory === category ? 'text-brand-teak font-medium' : 'text-gray-700'}
            first:rounded-t-lg last:rounded-b-lg
          `}
        >
          {category}
        </button>
      ))}
    </div>
  );
}