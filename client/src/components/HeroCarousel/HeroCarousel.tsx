import React, { useState, useEffect } from 'react';
import { HeroSlide } from './HeroSlide';
import { CarouselIndicators } from './CarouselIndicators';
import { CarouselNavigationButtons } from './CarouselNavigationButtons';
import { heroSlides } from '@/data/mockData';

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = heroSlides;

  // Auto-scroll functionality (only if more than 1 slide)
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500); // 4.5 second interval as specified

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-[393px] h-[215px] overflow-hidden bg-white">
      {/* Slides container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out`}
            style={{
              transform: `translateX(${(index - currentSlide) * 100}%)`,
            }}
          >
            <HeroSlide slide={slide} isActive={index === currentSlide} />
          </div>
        ))}
      </div>

      {/* Navigation buttons (only show if more than 1 slide) */}
      <CarouselNavigationButtons
        onPrevious={goToPrevious}
        onNext={goToNext}
        total={slides.length}
      />

      {/* Indicators (only show if more than 1 slide) */}
      <CarouselIndicators
        total={slides.length}
        current={currentSlide}
        onSelect={goToSlide}
      />
    </div>
  );
}