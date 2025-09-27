// client/src/components/Menu/FloatingCategoriesButton.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu } from 'lucide-react';
import { CategoryPicker } from './CategoryPicker';

interface FloatingCategoriesButtonProps {
  categories?: string[];
  onSelectCategory?: (category: string) => void;
  onClick?: () => void;
  /** distance from bottom of viewport in px so it stays above bottom nav */
  bottomOffsetPx?: number;
}

/**
 * Floating categories pill that opens a small, compact card (not fullscreen).
 * Replaces trashy huge modal with a compact portal-based card.
 */
export function FloatingCategoriesButton({
  categories = [],
  onSelectCategory,
  onClick,
  bottomOffsetPx = 70,
}: FloatingCategoriesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rightPx, setRightPx] = useState<number>(16);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  // Try to align pill to the site's content container so it's not flush to viewport edge
  function findContentContainer(): HTMLElement | null {
    const candidates = ['main', '.max-w-3xl', '.max-w-2xl', '.container', '.mx-auto', '#app'];
    for (const sel of candidates) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) return el;
    }
    return document.body;
  }

  const computeRightOffset = () => {
    try {
      const viewportW = window.innerWidth;
      const container = findContentContainer();
      if (!container) {
        setRightPx(16);
        return;
      }
      const rect = container.getBoundingClientRect();
      // distance between content column right edge and viewport right edge
      const distance = Math.max(0, viewportW - rect.right);
      const desired = Math.max(12, distance + 16);
      setRightPx(desired);
    } catch {
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

  // Close on outside click / Esc
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isOpen) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapperRef.current && !wrapperRef.current.contains(t)) {
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

  const handlePillClick = () => {
    if (typeof onClick === 'function') {
      onClick();
      return;
    }
    setIsOpen((v) => !v);
  };

  const handleSelect = (category: string) => {
    if (onSelectCategory) onSelectCategory(category);
    setIsOpen(false);
    if (pillRef.current) {
      pillRef.current.focus();
    }
  };

  if (typeof document === 'undefined') return null;

  let portalRoot = document.getElementById('category-overlay-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'category-overlay-root';
    document.body.appendChild(portalRoot);
  }

  const rightStyle = `${rightPx}px`;

  const portal = (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        zIndex: 9999,
        bottom: `${bottomOffsetPx}px`,
        right: rightStyle,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {/* container that includes the pill and the small absolute card */}
      <div style={{ marginLeft: 'auto', width: 'max-content', position: 'relative' }}>
        <button
          ref={pillRef}
          onClick={handlePillClick}
          aria-label="Open categories"
          aria-expanded={isOpen}
          aria-controls="category-picker-modal"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#3c3c3b] text-white shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#ae905c] focus:ring-offset-2"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {isOpen && (
          <div
            id="category-picker-modal"
            role="menu"
            aria-orientation="vertical"
            className="absolute"
            style={{
              bottom: 'calc(100% + 8px)', // sit above the pill
              right: 0,
              marginBottom: 8,
              width: 'min(18rem, 86vw)',
              background: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              padding: '6px',
              overflow: 'hidden',
              // overall cap so it doesn't take full screen
              maxHeight: '46vh',
            }}
          >
            <div style={{ maxHeight: '42vh', overflowY: 'auto' }}>
              <CategoryPicker categories={categories} onSelectCategory={handleSelect} onClose={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(portal, portalRoot);
}
