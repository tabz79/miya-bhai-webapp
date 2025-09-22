import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from 'wouter';

export function SearchBarPill() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();

  const handleSearch = () => {
    if (query.trim()) {
      setLocation(`/menu?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setLocation('/menu');
  };

  return (
    <div 
      className={`
        relative h-[36px] bg-white shadow-searchbox rounded-[20px] flex items-center px-4
        ${isExpanded ? 'w-full max-w-[280px]' : 'w-[180px]'}
        transition-all duration-200 ease-in-out
      `}
      onFocus={() => setIsExpanded(true)}
      onBlur={() => setIsExpanded(false)}
    >
      <input
        type="text"
        placeholder="Search dishes"
        className="flex-1 bg-transparent text-sm text-app-foreground outline-none placeholder:text-gray-500 pr-[50px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      {query && (
        <button onClick={handleClear} className="absolute right-[34px] top-1/2 -translate-y-1/2">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
      <button onClick={handleSearch} className="absolute right-[10px] top-1/2 -translate-y-1/2">
        <Search className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}