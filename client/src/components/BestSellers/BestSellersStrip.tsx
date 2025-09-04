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
      {/* Bestseller cards - exact Figma layout */}
      <div className="flex items-center gap-[15px] px-3 pt-[19px]">
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