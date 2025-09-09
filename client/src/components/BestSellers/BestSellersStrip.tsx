import React, { useRef, useState, useEffect } from 'react';
import { BestSellerCard } from './BestSellerCard';
import { bestsellers } from '@/data/mockData';

/**
 * BestSellersStrip.tsx
 * - CARD_WIDTH and CARD_GAP tuned so 4 cards fit exactly inside FRAME_WIDTH = 315
 * - Button X is 32px from the LEFT EDGE OF SCREEN (per your last instruction)
 * - Button Y is FRAME_TOP + 91 (per Figma)
 * - Buttons are 10x10 with gap 6, hidden until overflow exists
 */

export function BestSellersStrip() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // === Figma constants
  const FRAME_LEFT = 78; // px: left offset of cards frame from strip left
  const FRAME_TOP = 19; // px: top offset of cards frame from strip top
  const FRAME_WIDTH = 315; // px
  const FRAME_HEIGHT = 137; // px

  // Buttons per Figma
  const BUTTON_LEFT_FROM_SCREEN = 32; // px from mobile screen left edge (user insisted)
  const BUTTON_PAIR_Y_FROM_FRAME_TOP = 91; // px from frame top
  const BUTTON_SIZE = 10; // px each
  const BUTTON_GAP = 6; // px between the two buttons

  // Card sizing / scrolling
  const VISIBLE_COUNT = 4; // show 4 cards by default
  const CARD_WIDTH = 71; // px — chosen so 4 fit inside 315px with padding+gaps
  const CARD_GAP = 6; // px (Figma gap)
  const CARD_PADDING_LEFT = 12; // px inset inside the frame
  const SCROLL_AMOUNT = (CARD_WIDTH + CARD_GAP) * VISIBLE_COUNT - CARD_GAP;

  // check scroll and toggle buttons
  const checkScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const t = setTimeout(checkScrollButtons, 120);
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      clearTimeout(t);
      if (el) el.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, []);

  const scrollLeft = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  };

  // Buttons absolute positions
  // X: from screen left (per your instruction) -> we position relative to the strip container (section),
  // which aligns with the mobile width; using left: `${BUTTON_LEFT_FROM_SCREEN}px`.
  // Y: relative to the frame top (FRAME_TOP + BUTTON_PAIR_Y_FROM_FRAME_TOP)
  const pairLeftAbsolute = BUTTON_LEFT_FROM_SCREEN; // absolute from screen/strip left
  const pairTopAbsolute = FRAME_TOP + BUTTON_PAIR_Y_FROM_FRAME_TOP;

  return (
    <section className="w-full h-[137px] bg-colorbackgroundbestseller relative">
      {/* Heading */}
      <div className="absolute" style={{ top: '46px', left: '14px', width: '62px', height: '40px' }}>
        <h2 className="font-typography-section-title text-[16px] leading-[17px] font-normal text-colortextsectiontitle">
          Signature
        </h2>
        <h2 className="font-typography-section-title text-[16px] leading-[17px] font-normal text-colortextsectiontitle">
          Best Sellers
        </h2>
      </div>

      {/* Cards frame (exact frame coordinates) */}
      <div
        ref={scrollRef}
        className="absolute overflow-x-auto overflow-y-hidden box-border"
        style={{
          top: `${FRAME_TOP}px`,
          left: `${FRAME_LEFT}px`,
          width: `${FRAME_WIDTH}px`,
          height: `${FRAME_HEIGHT}px`,
          scrollbarWidth: 'none' as any,
        }}
      >
        <div
          className="inline-flex items-start"
          style={{
            gap: `${CARD_GAP}px`,
            paddingLeft: `${CARD_PADDING_LEFT}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {bestsellers.map((item) => (
            <div
              key={item.id}
              className="inline-block"
              style={{
                width: `${CARD_WIDTH}px`,
                flex: '0 0 auto',
                display: 'inline-block',
              }}
            >
              <BestSellerCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Button pair: X measured from screen left (32px), Y = FRAME_TOP + 91 */}
      <div
        style={{
          position: 'absolute',
          left: `${pairLeftAbsolute}px`,
          top: `${pairTopAbsolute}px`,
          display: 'flex',
          gap: `${BUTTON_GAP}px`,
          zIndex: 50,
        }}
        aria-hidden={!(showLeftButton || showRightButton)}
      >
        <button
          onClick={scrollLeft}
          aria-label="Previous bestsellers"
          className="flex items-center justify-center rounded-full bg-white"
          style={{
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            opacity: showLeftButton ? 1 : 0,
            pointerEvents: showLeftButton ? 'auto' : 'none',
            transition: 'opacity 140ms ease',
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={scrollRight}
          aria-label="Next bestsellers"
          className="flex items-center justify-center rounded-full bg-white"
          style={{
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            opacity: showRightButton ? 1 : 0,
            pointerEvents: showRightButton ? 'auto' : 'none',
            transition: 'opacity 140ms ease',
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* subtle scrollbar styling for WebKit */}
      <style>{`
        section ::-webkit-scrollbar { height: 6px; }
        section ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        section ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </section>
  );
}
