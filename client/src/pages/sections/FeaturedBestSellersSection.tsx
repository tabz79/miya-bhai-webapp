import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const FeaturedBestSellersSection = (): JSX.Element => {
  return (
    <Card className="w-full h-[137px] bg-colorbackgroundbestseller shadow-color-background-bestseller-shadow relative">
      <CardContent className="p-0 h-full">
        <img
          className="absolute w-[42px] h-[26px] top-[87px] left-[27px]"
          alt="Frame"
          src="/figmaAssets/frame-22.svg"
        />

        <div className="flex flex-col w-[62px] items-start gap-1.5 absolute top-[46px] left-3.5">
          <div className="relative self-stretch mt-[-1.00px] font-typography-section-title font-[number:var(--typography-section-title-font-weight)] text-colortextsectiontitle text-[length:var(--typography-section-title-font-size)] tracking-[var(--typography-section-title-letter-spacing)] leading-[var(--typography-section-title-line-height)] [font-style:var(--typography-section-title-font-style)]">
            Signature
          </div>

          <div className="relative self-stretch font-typography-section-title font-[number:var(--typography-section-title-font-weight)] text-white text-[length:var(--typography-section-title-font-size)] tracking-[var(--typography-section-title-letter-spacing)] leading-[var(--typography-section-title-line-height)] [font-style:var(--typography-section-title-font-style)]">
            Best Sellers
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
