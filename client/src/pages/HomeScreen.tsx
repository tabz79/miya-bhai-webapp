import { SearchIcon } from "lucide-react";
import React from "react";
import { BestSellersSection } from "./sections/BestSellersSection";
import { DeliveryAdSection } from "./sections/DeliveryAdSection";
import { FeaturedBestSellersSection } from "./sections/FeaturedBestSellersSection";
import { HeroSection } from "./sections/HeroSection";
import { MenuSection } from "./sections/MenuSection";
import { MenuTitleSection } from "./sections/MenuTitleSection";

export const HomeScreen = (): JSX.Element => {
  return (
    <div className="bg-white flex justify-center w-screen min-h-screen">
      <div className="bg-white w-[393px] flex flex-col relative">
        {/* Header */}
        <header className="flex w-full h-14 items-center gap-2.5 px-4 py-0 bg-colorbackgroundbeige">
          <img
            className="w-[70px] h-11 object-cover"
            alt="Logo"
            src="/figmaAssets/logo-2.png"
          />

          <div className="flex w-[180px] h-9 items-center justify-between px-2.5 py-2 ml-auto bg-colorbackgroundsearchfield rounded-[20px] shadow-effect-shadow-searchbox">
            <div className="font-typography-body-searchplaceholder font-[number:var(--typography-body-searchplaceholder-font-weight)] text-black text-[length:var(--typography-body-searchplaceholder-font-size)] tracking-[var(--typography-body-searchplaceholder-letter-spacing)] leading-[var(--typography-body-searchplaceholder-line-height)] [font-style:var(--typography-body-searchplaceholder-font-style)]">
              SearchIcon Dishes
            </div>

            <SearchIcon className="w-5 h-5" />
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection />

        {/* Featured and Best Sellers Section */}
        <div className="flex w-full">
          <div className="w-[20%]">
            <FeaturedBestSellersSection />
          </div>
          <div className="w-[80%]">
            <BestSellersSection />
          </div>
        </div>

        {/* Delivery Ad Section */}
        <DeliveryAdSection />

        {/* Menu Title Section */}
        <MenuTitleSection />

        {/* Menu Section */}
        <MenuSection />
      </div>
    </div>
  );
};
