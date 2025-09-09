import React, { useState } from 'react';
import { Toolbar } from '../components/Toolbar';
import { MetaTags } from '../components/MetaTags';
import { JsonLD } from '../components/JsonLD';
import { HeroSection } from './sections/HeroSection';
import { BestSellersStrip } from '../components/BestSellers/BestSellersStrip';
import { DeliveryAd } from '../components/DeliveryAd';
import { MenuHeader } from '../components/Menu/MenuHeader';
import { MenuGrid } from '../components/Menu/MenuGrid';
import { BottomNav } from '../components/BottomNav';
import { menu, categories, MenuItem } from '../data/mockData';

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter menu items by selected category
  const filteredItems = menu.filter(item => item.category === selectedCategory);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0); // Reset to first page when changing category
  };

  const handleAddToCart = (item: MenuItem) => {
    // TODO: Implement cart functionality
    console.log('Added to cart:', item);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="w-[393px] min-h-screen bg-app-background mx-auto">
      <MetaTags
        title="Miya Bhai Food Court - Authentic Middle Eastern & Indian Cuisine"
        description="Experience the finest Arabian Mandi, Chicken Biryani, Kebabs, and Shawarma at Miya Bhai Food Court. Fresh ingredients, traditional recipes, and exceptional flavors since 1995."
      />
      <JsonLD type="restaurant" />
      
      {/* 1. Toolbar (exact 56px height) */}
      <Toolbar />

      {/* 2. Hero Section (HeroSection provides heroImages -> HeroCarousel) */}
      <HeroSection />

      {/* 3. BestSellersStrip (exact 137px height, dark bg) */}
      <BestSellersStrip />

      {/* 4. DeliveryAd (exact 104px height, full-bleed; DeliveryAd manages its own padding) */}
      <DeliveryAd />

      {/* 5. MenuHeader + MenuGrid (8 cards in 4x2 layout) */}
      <MenuHeader
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        showPrevious={currentPage > 0}
        showNext={currentPage < totalPages - 1}
      />

      <MenuGrid
        items={filteredItems}
        onAddToCart={handleAddToCart}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* 6. Spacer for BottomNav (exact 49px) */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}
