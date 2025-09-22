
import React from 'react';

interface CategoryPickerProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ categories, onSelectCategory, onClose }) => {
  return (
    <div
      role="menu"
      aria-orientation="vertical"
    >
      <ul>
        {categories.map((category) => (
          <li key={category}>
            <button
              role="menuitem"
              data-cat={category}
              className="w-full text-left p-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-md"
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
