
import React, { useRef, useEffect } from 'react';

interface CategoryPickerProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ categories, onSelectCategory, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    // TODO: Add keyboard navigation for menu items
  };

  return (
    <div
      ref={pickerRef}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="category-picker-title"
      className="bg-white rounded-lg shadow-lg w-full max-w-xs"
      onKeyDown={handleKeyDown}
    >
      <h2 id="category-picker-title" className="text-lg font-semibold p-4 border-b">
        Categories
      </h2>
      <div className="overflow-y-auto max-h-64">
        <ul>
          {categories.map((category) => (
            <li key={category}>
              <button
                role="menuitem"
                className="w-full text-left p-4 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
