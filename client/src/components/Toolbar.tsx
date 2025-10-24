import React, { useEffect, useState } from 'react';
import { SearchBarPill } from './SearchBarPill';
import logo from '@/assets/logo.png';

/**
 * Toolbar (sticky header)
 * - Keeps Figma dimensions for logo and search pill visually
 * - Full-width header so `position: sticky` works with viewport flow
 * - Stable height (56px) to avoid layout jumps
 * - Adds subtle shadow when scrolled for visual feedback
 */
interface ToolbarProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export function Toolbar({ onSearch, initialQuery = '' }: ToolbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    // Make header span full width. Keep sticky top-0 z-50.
    // Keep exact Figma inner sizes for logo & pill via inner children.
    <header
      role="banner"
      className={`w-full sticky top-0 z-50 bg-app-background transition-shadow duration-150`}
      style={{ height: 56 }} // 56px per Figma (h-[56px])
      aria-label="Top toolbar"
    >
      <div
        className={`max-w-[1200px] mx-auto h-full px-4 flex items-center justify-between ${scrolled ? 'shadow-sm' : ''
          }`}
      >
        {/* Logo - exact Figma specs: 70x44 */}
        <div className="flex-shrink-0">
          <img
            src={logo}
            alt="Miya Bhai Food Court"
            className="h-full w-auto object-contain max-h-[44px]"
            width={70}
            height={44}
          />
        </div>

        {/* Search bar - exact Figma specs: 180x36 */}
        <div className="flex-shrink-0 w-full max-w-[180px] h-full">
          <div>
            <SearchBarPill onSearch={onSearch} initialQuery={initialQuery} />
          </div>
        </div>
      </div>
    </header>
  );
}
