import React from "react";

export const HeroSection = (): JSX.Element => {
  const paginationDots = [
    {
      className:
        "w-1 h-1 bg-[#ffffff01] rounded-[18px] shadow-[0px_0px_0px_1px_#007a4b]",
    },
    { className: "w-[3px] h-[3px] bg-black rounded-md" },
    { className: "w-[7px] h-[3px] bg-black rounded-md" },
  ];

  const descriptionLines = [
    "Experience the Legendary",
    "taste that has made",
    "Miya Bhai",
    "a household name across",
    "generations.",
  ];

  return (
    <section className="w-full h-[215px] bg-colorbackgroundbeige relative">
      <div className="flex w-9 h-[11px] items-center justify-center gap-[5px] px-[5px] py-[3px] absolute top-[180px] left-[260px]">
        {paginationDots.map((dot, index) => (
          <div key={index} className={`relative ${dot.className}`} />
        ))}
      </div>

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

      <div className="flex w-[230px] h-[114px] items-center justify-center gap-2.5 p-2.5 absolute top-[66px] left-[163px]">
        <img
          className="relative flex-1 grow h-[95.45px] mt-[-0.73px] mb-[-0.73px] object-cover"
          alt="Hero image"
          src="/figmaAssets/heroimage.png"
        />
      </div>

      <div className="flex flex-wrap w-[197px] items-start gap-[6px_8px] absolute top-[26px] left-4">
        <div className="relative w-fit mt-[-1.00px] [text-shadow:0px_0px_4px_#00000040] font-typography-hero-h1 font-[number:var(--typography-hero-h1-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h1-font-size)] tracking-[var(--typography-hero-h1-letter-spacing)] leading-[var(--typography-hero-h1-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h1-font-style)] shadow-effect-text-shadow-heroh1">
          Nizam&apos;s
        </div>

        <div className="relative w-fit mt-[-1.00px] [text-shadow:0px_0px_15px_#00000040] font-typography-hero-h2 font-[number:var(--typography-hero-h2-font-weight)] text-colortextheroprimary text-[length:var(--typography-hero-h2-font-size)] tracking-[var(--typography-hero-h2-letter-spacing)] leading-[var(--typography-hero-h2-line-height)] whitespace-nowrap [font-style:var(--typography-hero-h2-font-style)] shadow-effect-text-shadow-heroh2">
          Royal Flavours,
        </div>

        <div className="relative w-fit font-typography-her-tagline font-[number:var(--typography-her-tagline-font-weight)] text-colortextheroprimary text-[length:var(--typography-her-tagline-font-size)] tracking-[var(--typography-her-tagline-letter-spacing)] leading-[var(--typography-her-tagline-line-height)] whitespace-nowrap [font-style:var(--typography-her-tagline-font-style)]">
          Perfected since 1960
        </div>
      </div>
    </section>
  );
};
