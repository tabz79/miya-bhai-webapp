import React, { useState } from "react";
import { SearchBarPill } from "@/components/SearchBarPill";
import { BestSellersSection } from "./sections/BestSellersSection";
import { DeliveryAdSection } from "./sections/DeliveryAdSection";
import { FeaturedBestSellersSection } from "./sections/FeaturedBestSellersSection";
import { HeroSection } from "./sections/HeroSection";
import { MenuSection } from "./sections/MenuSection";
import { MenuTitleSection } from "./sections/MenuTitleSection";

export const HomeScreen = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState<string>("");

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

          <div className="ml-auto">
            <SearchBarPill onSearch={setSearchQuery} initialQuery={searchQuery} />
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
            <BestSellersSection searchQuery={searchQuery} />
          </div>
        </div>

        {/* Delivery Ad Section */}
        <DeliveryAdSection />

        {/* Menu Title Section */}
        <MenuTitleSection />

        {/* Menu Section */}
        <MenuSection searchQuery={searchQuery} />
      </div>
    </div>
  );
};
