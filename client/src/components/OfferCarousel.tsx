import React, { useState, useEffect } from 'react';
import { resolveImage } from '@/lib/image-resolver';

interface Banner {
  id: string;
  title: string;
  image: string; // This will now be a direct path
}

export function OfferCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/banners.json');
        const banners: Banner[] = await response.json();
        setActiveBanners(banners);
      } catch (error) {
        console.error("Failed to load banners:", error);
        setActiveBanners([]); // Fallback to empty on error
      }
    };

    fetchBanners();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (activeBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 3000); // 3 second interval for offers

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return null; // Don't render the carousel if there are no active banners
  }

  return (
    <div className="relative w-full h-32 overflow-hidden bg-gray-100">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {activeBanners.map((poster, index) => (
          <div key={poster.id} className="w-full h-32 flex-shrink-0 relative">
            <img
              src={resolveImage(poster)}
              alt={poster.title}
              className="w-full h-full object-cover"
            />

          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
        {activeBanners.map((_, index) => (
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