import React, { useState } from 'react';
import { OfferCarousel } from '../components/OfferCarousel';
import { MetaTags } from '../components/MetaTags';
import { JsonLD } from '../components/JsonLD';
import { MenuHeader } from '../components/Menu/MenuHeader';
import { MenuGrid } from '../components/Menu/MenuGrid';
import { BottomNav } from '../components/BottomNav';
import { menu as mockMenu, categories, MenuItem } from '../data/mockData';

export function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // TODO: Replace with actual API call, e.g., fetch('/api/menu')
    setMenu(mockMenu);
  }, []);

  // Filter menu items by selected category
  const filteredItems = menu.filter(item => item.category === selectedCategory);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
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
    <div className="w-full min-h-screen bg-app-background">
      <MetaTags
        title="Menu - Browse Our Delicious Selection"
        description="Explore our complete menu featuring authentic Arabian Mandi, Chicken Biryani, grilled Kebabs, fresh Shawarma, and traditional desserts. Order online for delivery."
      />
      <JsonLD type="menu" />
      {/* OfferCarousel at top */}
      <OfferCarousel />

      {/* MenuExplorer with categories */}
      <MenuHeader
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        showPrevious={currentPage > 0}
        showNext={currentPage < totalPages - 1}
      />

      {/* Menu items grid */}
      <MenuGrid
        items={filteredItems}
        onAddToCart={handleAddToCart}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}