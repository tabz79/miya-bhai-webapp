import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBarPill() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`
        h-9 bg-white shadow-searchbox rounded-[20px] flex items-center px-4
        ${isExpanded ? 'w-full' : 'w-[180px]'}
        transition-all duration-200 ease-in-out
      `}
      onClick={() => setIsExpanded(true)}
      onBlur={() => setIsExpanded(false)}
    >
      <input
        type="text"
        placeholder="Search dishes"
        className="flex-1 bg-transparent text-sm text-app-foreground outline-none placeholder:text-gray-500"
      />
      <Search className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
    </div>
  );
}