// client/src/components/Menu/CategoryJumpPill.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { CategoryPicker } from './CategoryPicker';

interface CategoryJumpPillProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
}

function findContentContainer(): HTMLElement | null {
  // candidate selectors to detect content column/container used in the app
  const candidates = [
    'main', // common
    '.max-w-3xl',
    '.max-w-2xl',
    '.container',
    '.mx-auto',
    '#app', // if exists
    '.app-root',
    '.page-wrapper',
  ];
  for (const sel of candidates) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  // fallback: try to find element with centered layout by heuristics
  const all = Array.from(document.querySelectorAll<HTMLElement>('div'));
  for (const el of all) {
    const style = getComputedStyle(el);
    if (style.marginLeft !== '0px' && style.marginRight !== '0px' && parseFloat(style.maxWidth || '0') > 0) {
      return el;
    }
  }
  return null;
}

export const CategoryJumpPill: React.FC<CategoryJumpPillProps> = ({ categories, onSelectCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rightPx, setRightPx] = useState<number | null>(null); // px from viewport right
  const pillRef = useRef<HTMLButtonElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('CategoryJumpPill mounted (portal). categories:', categories?.length);
  }, [categories]);

  // compute desired right offset (in px) relative to viewport edge so pill sits inside content column
  const computeRightOffset = () => {
    try {
      const viewportW = window.innerWidth;
      const container = findContentContainer();
      if (!container) {
        setRightPx(16); // default 16px from viewport edge
        return;
      }
      const rect = container.getBoundingClientRect();
      // distance between viewport right edge and container right edge
      const distance = Math.max(0, viewportW - rect.right);
      const desired = Math.max(12, distance + 16); // at least 12px inset, add 16px margin inside container
      setRightPx(desired);
    } catch (err) {
      setRightPx(16);
    }
  };

  useEffect(() => {
    computeRightOffset();
    const onResize = () => computeRightOffset();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onDocKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onDocKey);
    };
  }, [isOpen]);

  const handlePillClick = () => setIsOpen((v) => !v);

  const handleCategorySelect = (category: string) => {
    onSelectCategory(category);
    setIsOpen(false);
    pillRef.current?.focus();
  };

  if (typeof document === 'undefined') return null;

  const rightStyle = rightPx != null ? `${rightPx}px` : '16px';

  const portal = (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        zIndex: 99999,
        bottom: '70px',
        right: rightStyle,
        maxWidth: 'calc(100% - 32px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        pointerEvents: 'auto',
      }}
      aria-hidden={false}
    >
      <div style={{ marginLeft: 'auto', width: 'max-content' }}>
        <button
          ref={pillRef}
          onClick={handlePillClick}
          aria-label="Open categories"
          aria-expanded={isOpen}
          aria-controls="category-picker-modal"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#3c3c3b] text-white shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#ae905c] focus:ring-offset-2 focus:ring-offset-white"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {isOpen && (
          <div
            id="category-picker-modal"
            role="menu"
            aria-orientation="vertical"
            className="absolute bottom-full right-0 mb-2 transform origin-bottom-right transition-all duration-150 ease-out"
            style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
          >
            <CategoryPicker
              categories={categories}
              onSelectCategory={handleCategorySelect}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(portal, document.body);
};
