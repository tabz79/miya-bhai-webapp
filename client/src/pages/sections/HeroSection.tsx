import React from "react";
import { HeroCarousel } from "@/components/HeroCarousel/HeroCarousel";

// Imported hero images
import Hero1 from "@/assets/HeroImage1.png";
import Hero2 from "@/assets/HeroImage2.png";
import Hero3 from "@/assets/HeroImage3.png";
import Hero4 from "@/assets/HeroImage4.png";
import Hero5 from "@/assets/HeroImage5.png";
import Hero6 from "@/assets/HeroImage6.png";

const heroImages = [Hero1, Hero2, Hero3, Hero4, Hero5, Hero6];

export const HeroSection = (): JSX.Element => {
  return <HeroCarousel images={heroImages} />;
};
