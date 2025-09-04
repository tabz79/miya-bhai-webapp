import React, { useState } from 'react';
import { CategoryPill } from './CategoryPill';
import { DropdownToggleButton } from './DropdownToggleButton';
import { CategoryDropdown } from './CategoryDropdown';
import { GridNavigationButtons } from './GridNavigationButtons';
import { categories } from '@/data/mockData';

interface MenuHeaderProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  showPrevious: boolean;
  showNext: boolean;
}

export function MenuHeader({ 
  selectedCategory, 
  onCategoryChange, 
  onPreviousPage, 
  onNextPage, 
  showPrevious, 
  showNext 
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

        {/* Right side: Grid navigation buttons */}
        <GridNavigationButtons
          onPrevious={onPreviousPage}
          onNext={onNextPage}
          showPrevious={showPrevious}
          showNext={showNext}
        />
      </div>
    </div>
  );
}