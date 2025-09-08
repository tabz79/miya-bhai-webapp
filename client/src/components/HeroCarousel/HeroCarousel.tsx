import fallbackHero from "@/assets/HeroImage1.png";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CarouselIndicators } from "./CarouselIndicators";

interface HeroCarouselProps {
  images?: string[];
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function HeroCarousel({ images = [] }: HeroCarouselProps) {
  const imgs = Array.isArray(images) && images.length > 0 ? images : [fallbackHero];
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);

  const imageIndex = ((page % imgs.length) + imgs.length) % imgs.length;

  const paginate = (newDirection: number) => {
    setPage(([p, _d]) => [p + newDirection, newDirection]);
  };

  const goToSlide = (slideIndex: number) => {
    setPage(([p]) => {
      const newDirection = slideIndex > p ? 1 : -1;
      return [slideIndex, newDirection];
    });
  };

  useEffect(() => {
    if (imgs.length <= 1) return;

    const id = setInterval(() => {
      setPage(([p]) => [p + 1, 1]);
    }, 4500);

    return () => clearInterval(id);
  }, [imgs.length]);

  return (
    <div className="relative w-[393px] h-[215px] overflow-hidden bg-colorbackgroundbeige">
      {/* Animated Image Container - anchored by left/top per Figma */}
      <div className="absolute top-[66px] left-[163px] w-[230px] h-[114px] p-[10px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            className="absolute inset-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <img
              src={imgs[imageIndex]}
              alt={`hero-${imageIndex}`}
              className="w-full h-full object-cover rounded-md"
              width={230}
              height={114}
              loading="lazy"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Static Text Overlay */}
      <div className="absolute z-10 top-0 left-0 p-4 pointer-events-none">
        <div className="flex flex-wrap w-[197px] items-start gap-[6px_8px] absolute top-[26px] left-4">
          <div className="relative w-fit mt-[-1px] [text-shadow:0px_0px_4px_#00000040] font-typography-hero-h1 font-[number:var(--typography-hero-h1-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h1-font-size)] tracking-[var(--typography-hero-h1-letter-spacing)] leading-[var(--typography-hero-h1-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h1-font-style)]">
            Nizam's
          </div>
          <div className="relative w-fit mt-[-1px] [text-shadow:0px_0px_15px_#00000040] font-typography-hero-h2 font-[number:var(--typography-hero-h2-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h2-font-size)] tracking-[var(--typography-hero-h2-letter-spacing)] leading-[var(--typography-hero-h2-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h2-font-style)]">
            Royal Flavours,
          </div>
          <div className="relative w-fit font-typography-her-tagline font-[number:var(--typography-her-tagline-font-weight)] text-colortextheroprimary text-[length:var(--typography-her-tagline-font-size)] tracking-[var(--typography-her-tagline-letter-spacing)] leading-[var(--typography-her-tagline-line-height)] whitespace-nowrap [font-style:var(--typography-her-tagline-font-style)]">
            Perfected since 1960
          </div>
        </div>

        <div className="flex flex-col w-[130px] items-center justify-center absolute top-[95px] left-4">
          <div className="relative self-stretch mt-[-1px] font-typography-hero-description font-[number:var(--typography-hero-description-font-weight)] text-colortextherodescription text-[length:var(--typography-hero-description-font-size)] tracking-[var(--typography-hero-description-letter-spacing)] leading-[var(--typography-hero-description-line-height)] [font-style:var(--typography-hero-description-font-style)]">
            Experience the Legendary taste that has made{" "}
            <span className="font-typography-hero-description-b font-[number:var(--typography-hero-description-b-font-weight)] [font-style:var(--typography-hero-description-b-font-style)]">
              Miya Bhai
            </span>{" "}
            a household name across generations.
          </div>
        </div>
      </div>

      {/* Indicators (bottom center) */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto">
        <CarouselIndicators total={imgs.length} current={imageIndex} onSelect={goToSlide} />
      </div>
    </div>
  );
}
