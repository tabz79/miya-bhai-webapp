// client/src/pages/Home.tsx  (patched)
import React, { useEffect, useMemo, useState } from "react";
import { Toolbar } from "../components/Toolbar";
import { MetaTags } from "../components/MetaTags";
import { JsonLD } from "../components/JsonLD";
import { HeroSection } from "./sections/HeroSection";
import { BestSellersStrip } from "../components/BestSellers/BestSellersStrip";
import { DeliveryAd } from "../components/DeliveryAd";
import { MenuHeader } from "../components/Menu/MenuHeader";
import { MenuGrid, MenuCardGrid } from "@/components/Menu";
import { BottomNav } from "../components/BottomNav";
import canonicalMenu from "@/data/menu.canonical.json";
import imagesMapRaw from "../data/images-map.json";
import { sortCategories } from "../lib/category-mapper";
import { useCartStore } from "@/hooks/useCartStore";
import { sortMenuItems } from "../lib/menu-utils";
import { slugify } from "@/lib/utils";
import { useLocation } from "wouter";
import { resolveImage } from "@/lib/image-resolver";

type MenuItem = any;

const imagesMap = (imagesMapRaw as Record<string, any>) || {};
const CLOUD_NAME =
  import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env?.VITE_CLOUD_NAME ||
  null;



export function Home(): JSX.Element {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (Array.isArray(canonicalMenu) && canonicalMenu.length) {
      setMenu(canonicalMenu as MenuItem[]);
    } else {
      setMenu([]);
      console.warn("client/src/data/menu.canonical.json is empty or missing");
    }
  }, []);

  useEffect(() => {
    if (!menu || menu.length === 0) {
      setCategories([]);
      setSelectedCategory("");
      return;
    }
    const all = Array.from(
      new Set(menu.map((it) => ((it.category || "Uncategorized") as string).trim()))
    ).filter(Boolean);
    const sorted = sortCategories(all);
    setCategories(sorted);
    if (!selectedCategory || !all.includes(selectedCategory)) {
      setSelectedCategory(sorted[0] || "");
    }
  }, [menu]);

  const itemsWithResolvedImages = useMemo(() => {
    const mapped = (menu || []).map((it) => ({
      ...it,
      resolvedImage: resolveImage(it),
    }));
    return sortMenuItems(mapped);
  }, [menu]);

  const itemsWithImages = itemsWithResolvedImages;
  const categoryFilteredItems = useMemo(() => {
    return selectedCategory
      ? itemsWithImages.filter((it) => ((it.category || "").trim() === selectedCategory))
      : itemsWithImages;
  }, [itemsWithImages, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const { addToCart } = useCartStore();
  const handleAddToCart = (item: MenuItem) => addToCart({
    id: item.id,
    name: item.title || item.name,
    price: item.price,
    image: item.resolvedImage
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    const q = (debouncedQuery || "").toLowerCase();
    if (!q) return [];
    return itemsWithImages
      .filter((it) => {
        const title = (it.title || it.name || "").toString().toLowerCase();
        const desc = (it.description || it.subtitle || "").toString().toLowerCase();
        return title.includes(q) || desc.includes(q);
      })
      .slice(0, 6);
  }, [debouncedQuery, itemsWithImages]);

  const handleSearch = (q: string) => {
    console.debug("[Home] handleSearch ->", q);
    setSearchQuery(q);
    setShowModal(!!q && q.trim().length > 0);
  };

  const [, setLocation] = useLocation();
  const handleResultClick = (item: MenuItem) => {
    const itemSlug = item.id; // Use the unique ID from the data
    sessionStorage.setItem("scrollToSlug", itemSlug);
    setLocation(`/menu?q=${encodeURIComponent(searchQuery)}`);
    setShowModal(false);
  };

  return (
    <div className="w-[393px] min-h-screen bg-app-background mx-auto">
      <MetaTags title="Miya Bhai Food Court - Home" description="Miya Bhai food app" />
      <JsonLD type="restaurant" />
      <Toolbar onSearch={handleSearch} initialQuery={searchQuery} />

      <HeroSection />
      <BestSellersStrip />
      <DeliveryAd />

      {showModal && debouncedQuery && (
        <div
          id="home-search-modal"
          className="fixed inset-0 z-[1000] flex items-start justify-center px-4"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[360px] mx-auto transition-transform duration-300 ease-out"
            style={{
              maxWidth: "360px",
              maxHeight: "70vh",
              marginTop: 56,
              transformOrigin: "center top",
            }}
          >
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden transform transition-all duration-250">
              <div className="p-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full flex-1">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="11" cy="11" r="6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search dishes, categories or ingredients..."
                      className="bg-transparent outline-none w-full text-sm"
                      autoFocus
                    />
                  </div>
                  <button onClick={() => setShowModal(false)} className="ml-2 px-2 py-1 rounded text-sm hover:bg-gray-100">
                    Close
                  </button>
                </div>
              </div>

              <div className="p-3 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", maxHeight: "calc(70vh - 112px)" }}>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.map((item, i) => (
                      <button
                        key={item.id ?? `${(item.title || item.name || "")}-${i}`}
                        type="button"
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left bg-white rounded-lg shadow-sm border p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.resolvedImage ? (
                            <img src={item.resolvedImage} alt={item.title || item.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{item.title || item.name}</div>
                          {item.price && <div className="text-xs text-gray-500">₹{item.price}</div>}
                        </div>
                        <div className="text-xs text-gray-400">View</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-8">No results for “{debouncedQuery}”.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MenuHeader categories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <MenuGrid
        items={categoryFilteredItems}
        onAddToCart={handleAddToCart}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        CardComponent={MenuCardGrid}
      />

      <div className="h-[49px]" />
      <BottomNav />
    </div>
  );
}

export default Home;
