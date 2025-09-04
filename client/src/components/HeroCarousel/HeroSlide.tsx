import React from 'react';
import { HeroSlide as HeroSlideData } from '@/data/mockData';

interface HeroSlideProps {
  slide: HeroSlideData;
  isActive: boolean;
}

export function HeroSlide({ slide, isActive }: HeroSlideProps) {
  const descriptionLines = [
    "Experience the Legendary",
    "taste that has made",
    "Miya Bhai",
    "a household name across",
    "generations.",
  ];

  return (
    <div className={`w-full h-full flex-shrink-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      <section className="w-full h-[215px] bg-colorbackgroundbeige relative">
        {/* Hero title and tagline - exact Figma positioning */}
        <div className="flex flex-wrap w-[197px] items-start gap-[6px_8px] absolute top-[26px] left-4">
          <div className="relative w-fit mt-[-1.00px] [text-shadow:0px_0px_4px_#00000040] font-typography-hero-h1 font-[number:var(--typography-hero-h1-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h1-font-size)] tracking-[var(--typography-hero-h1-letter-spacing)] leading-[var(--typography-hero-h1-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h1-font-style)] shadow-effect-text-shadow-heroh1">
            Nizam's
          </div>

          <div className="relative w-fit mt-[-1.00px] [text-shadow:0px_0px_15px_#00000040] font-typography-hero-h2 font-[number:var(--typography-hero-h2-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h2-font-size)] tracking-[var(--typography-hero-h2-letter-spacing)] leading-[var(--typography-hero-h2-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h2-font-style)] shadow-effect-text-shadow-heroh2">
            Royal Flavours,
          </div>

          <div className="relative w-fit font-typography-her-tagline font-[number:var(--typography-her-tagline-font-weight)] text-colortextheroprimary text-[length:var(--typography-her-tagline-font-size)] tracking-[var(--typography-her-tagline-letter-spacing)] leading-[var(--typography-her-tagline-line-height)] whitespace-nowrap [font-style:var(--typography-her-tagline-font-style)]">
            Perfected since 1960
          </div>
        </div>

        {/* Hero description - exact Figma positioning */}
        <div className="flex flex-col w-[130px] items-center justify-center absolute top-[95px] left-4">
          {descriptionLines.map((line, index) => (
            <div
              key={index}
              className={`relative self-stretch ${index === 0 ? "mt-[-1.00px]" : ""} ${
                line === "Miya Bhai"
                  ? "font-typography-hero-description-b font-[number:var(--typography-hero-description-b-font-weight)] text-colortextherodescription text-[length:var(--typography-hero-description-b-font-size)] tracking-[var(--typography-hero-description-b-letter-spacing)] leading-[var(--typography-hero-description-b-line-height)] [font-style:var(--typography-hero-description-b-font-style)]"
                  : "font-typography-hero-description font-[number:var(--typography-hero-description-font-weight)] text-colortextherodescription text-[length:var(--typography-hero-description-font-size)] tracking-[var(--typography-hero-description-letter-spacing)] leading-[var(--typography-hero-description-line-height)] [font-style:var(--typography-hero-description-font-style)]"
              }`}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Hero image container - exact Figma specs: 230×114 holder */}
        <div className="flex w-[230px] h-[114px] items-center justify-center gap-2.5 p-2.5 absolute top-[66px] left-[163px]">
          <img
            className="relative flex-1 grow h-[95.45px] mt-[-0.73px] mb-[-0.73px] object-cover"
            alt="Hero image"
            src={slide.image}
          />
        </div>
      </section>
    </div>
  );
}