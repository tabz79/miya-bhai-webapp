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
    <section className="relative w-full h-[137px] bg-bestseller-bg">
      {/* Title */}
      <div className="pt-4 pb-3 px-4">
        <h2 className="text-white font-semibold text-lg">Best Sellers</h2>
      </div>

      {/* Scrollable container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-[15px] px-4 pb-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
      </div>
    </section>
  );
}