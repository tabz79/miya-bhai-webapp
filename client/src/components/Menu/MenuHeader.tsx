import React, { useState } from 'react';
import { CategoryPill } from './CategoryPill';
import { DropdownToggleButton } from './DropdownToggleButton';
import { CategoryDropdown } from './CategoryDropdown';

interface MenuHeaderProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function MenuHeader({ 
  categories,
  selectedCategory, 
  onCategoryChange,
}: MenuHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    setIsDropdownOpen(false);
  };

  return (
    <div className="px-4 py-4 bg-app-background">
      <div className="flex items-center justify-between">
        {/* Left side: Title and category controls */}
        <div className="flex items-center gap-3">
          <h2 className="text-app-foreground font-semibold text-lg">Menu</h2>
          
          <div className="relative flex items-center gap-2">
            <CategoryPill
              category={selectedCategory}
              isActive={true}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            <DropdownToggleButton
              isOpen={isDropdownOpen}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            
            <CategoryDropdown
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              isOpen={isDropdownOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}