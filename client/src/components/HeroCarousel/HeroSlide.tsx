import React from 'react';
import { HeroSlide as HeroSlideData } from '@/data/mockData';

interface HeroSlideProps {
  slide: HeroSlideData;
  isActive: boolean;
}

export function HeroSlide({ slide, isActive }: HeroSlideProps) {
  return (
    <div className={`w-full h-full flex-shrink-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative w-[393px] h-[215px] bg-app-background">
        {/* Exact Figma specs: 230x114 holder with 210x95 image inside */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[230px] h-[114px] bg-white rounded-lg flex items-center justify-center shadow-sm">
            <img
              src={slide.image}
              alt={slide.title || "Hero image"}
              className="w-[210px] h-[95px] object-cover rounded-md"
            />
          </div>
        </div>
        
        {/* Text overlay if title/description provided */}
        {(slide.title || slide.description) && (
          <div className="absolute bottom-6 left-6 right-6">
            {slide.title && (
              <h2 className="text-app-foreground font-bold text-lg mb-1">{slide.title}</h2>
            )}
            {slide.description && (
              <p className="text-gray-600 text-sm">{slide.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}