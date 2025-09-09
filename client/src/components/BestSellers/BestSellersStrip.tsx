import React, { useRef, useState, useEffect } from 'react';
import { BestSellerCard } from './BestSellerCard';
import { ScrollControlButtons } from './ScrollControlButtons';
import { bestsellers } from '@/data/mockData';

export function BestSellersStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // Check scroll position and show/hide buttons
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full h-[137px] bg-colorbackgroundbestseller relative">
      {/* Heading */}
      <div className="absolute top-[46px] left-[14px] w-[62px] h-[40px] flex flex-col gap-[6px]">
        <h2 className="font-typography-section-title text-[16px] leading-[17px] font-normal text-colortextsectiontitle">
          Signature
        </h2>
        <h2 className="font-typography-section-title text-[16px] leading-[17px] font-normal text-colortextsectiontitle">
          Best Sellers
        </h2>
      </div>

      {/* Bestseller cards - align to strip top; 12px inset from the cards frame edge */}
      <div
        ref={scrollRef}
        className="absolute top-0 left-[78px] w-[315px] h-[137px] flex items-center gap-[15px] pl-[12px] box-border overflow-x-auto"
      >
        {bestsellers.map((item) => (
          <BestSellerCard key={item.id} item={item} />
        ))}
      </div>

      {/* Scroll control buttons */}
      <ScrollControlButtons
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
        showLeft={showLeftButton}
        showRight={showRightButton}
      />
    </section>
  );
}
