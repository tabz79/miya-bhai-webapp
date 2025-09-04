import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const BestSellersSection = (): JSX.Element => {
  const bestSellers = [
    {
      image: "/figmaAssets/chickenbiryani-bestseller-png.png",
      alt: "Chickenbiryani",
      title: "Chicken Biryani",
      description: "Slow cooked rice, Chicken, enriched with Nizami spices",
    },
    {
      image: "/figmaAssets/arabianmandi-bestseller-png.png",
      alt: "Arabianmandi",
      title: "Arabian Mandi",
      description: "Aromatic rice, tender Meat with Middle Eastern spices.",
    },
    {
      image: "/figmaAssets/shawarma-bestseller-png.png",
      alt: "Shawarma bestseller",
      title: "Shawarma",
      description: "Juicy nizami meat rolled in a bread",
    },
    {
      image: "/figmaAssets/kebeb-bestseller-png.png",
      alt: "Kebeb bestseller png",
      title: "Kebeb",
      description: "Charcoal grilled meat, marinated in Nizami blends.",
    },
  ];

  return (
    <section className="w-full relative">
      <div className="flex items-center gap-[15px] px-3 pt-[19px]">
        {bestSellers.map((item, index) => (
          <Card
            key={index}
            className="flex flex-col w-[60px] h-[100px] items-center gap-1 px-4 py-2 bg-colorsurfacecard rounded-[95px] shadow-effect-card-shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardContent className="relative p-0 flex flex-col items-center">
              <img
                className="relative w-[53px] h-[53px] mt-[-3.00px] ml-[-12.50px] mr-[-12.50px] object-cover"
                alt={item.alt}
                src={item.image}
              />

              <h3 className="absolute h-[7px] top-[57px] left-1/2 transform -translate-x-1/2 font-typography-card-title font-[number:var(--typography-card-title-font-weight)] text-effecttext-shadowcardtitle text-[length:var(--typography-card-title-font-size)] text-center tracking-[var(--typography-card-title-letter-spacing)] leading-[var(--typography-card-title-line-height)] whitespace-nowrap [font-style:var(--typography-card-title-font-style)]">
                {item.title}
              </h3>

              <p className="absolute w-[34px] h-[26px] top-[68px] left-1/2 transform -translate-x-1/2 font-typography-card-description font-[number:var(--typography-card-description-font-weight)] text-colortextcarddescription text-[length:var(--typography-card-description-font-size)] text-center tracking-[var(--typography-card-description-letter-spacing)] leading-[var(--typography-card-description-line-height)] [font-style:var(--typography-card-description-font-style)]">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
