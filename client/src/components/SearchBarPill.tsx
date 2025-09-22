import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarPillProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchBarPill({ onSearch, initialQuery = '' }: SearchBarPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const triggerSearch = (q: string) => {
    onSearch?.(q ?? '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch(query);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    triggerSearch(newQuery);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`
        relative h-[36px] bg-white shadow-searchbox rounded-[20px] flex items-center px-4
        ${isExpanded ? 'w-full max-w-[280px]' : 'w-[180px]'}
        transition-all duration-200 ease-in-out
      `}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search dishes"
        className="flex-1 bg-transparent text-sm text-app-foreground outline-none placeholder:text-gray-500 pr-[50px]"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-[34px] top-1/2 -translate-y-1/2"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
      <button
        type="button"
        onClick={() => triggerSearch(query)}
        className="absolute right-[10px] top-1/2 -translate-y-1/2"
      >
        <Search className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
