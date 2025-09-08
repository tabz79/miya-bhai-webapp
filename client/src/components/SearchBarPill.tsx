import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBarPill() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`
        relative h-[36px] bg-white shadow-searchbox rounded-[20px] flex items-center px-4
        ${isExpanded ? 'w-full max-w-[280px]' : 'w-[180px]'}
        transition-all duration-200 ease-in-out
      `}
      onClick={() => setIsExpanded(true)}
      onBlur={() => setIsExpanded(false)}
    >
      <input
        type="text"
        placeholder="Search dishes"
        className="flex-1 bg-transparent text-sm text-app-foreground outline-none placeholder:text-gray-500 pr-[26px]"
      />
      <Search className="absolute right-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
    </div>
  );
}