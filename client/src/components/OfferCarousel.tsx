import React, { useState, useEffect } from 'react';
import { offerPosters } from '@/data/mockData';

export function OfferCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offerPosters.length);
    }, 3000); // 3 second interval for offers

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-32 overflow-hidden bg-gray-100">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {offerPosters.map((poster, index) => (
          <div key={poster.id} className="w-full h-32 flex-shrink-0 relative">
            <img
              src={poster.image}
              alt={poster.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <h3 className="text-white text-lg font-bold text-center px-4">
                {poster.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
        {offerPosters.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-4' : 'bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}