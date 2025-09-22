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
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-y-auto overscroll-contain py-2 px-3"
      role="region"
      aria-label="Categories"
      // ensure the dropdown never overlaps the bottom nav — adjust 200px to account for header and bottom nav
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div role="listbox" aria-activedescendant={selectedCategory ? `cat-${selectedCategory}` : undefined}>
        {categories.map((category, idx) => (
          <button
            id={`cat-${category}`}
            key={category}
            onClick={() => onSelectCategory(category)}
            role="option"
            aria-selected={selectedCategory === category}
            className={`
              w-full py-3 text-center text-sm hover:bg-gray-50 transition-colors
              ${selectedCategory === category ? 'text-brand-teak font-medium' : 'text-gray-700'}
              ${idx === 0 ? 'first:rounded-t-lg' : ''} ${idx === categories.length - 1 ? 'last:rounded-b-lg' : ''}
            `}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
