import React, { useEffect, useMemo, useState } from "react";
import { Toolbar } from "../components/Toolbar";
import { MetaTags } from "../components/MetaTags";
import { JsonLD } from "../components/JsonLD";
import { MenuHeader } from "../components/Menu/MenuHeader";
import { MenuGrid, MenuCardFlat } from "@/components/Menu";
import { BottomNav } from "../components/BottomNav";
import canonicalMenu from "@/data/menu.canonical.json";
import imagesMapRaw from "../data/images-map.json";
import { sortCategories } from "../lib/category-mapper";
import { sortMenuItems } from "../lib/menu-utils";
import { slugify } from "@/lib/utils";

import { useCartStore } from "@/hooks/useCartStore";
import { CategoryJumpPill } from "../components/Menu/CategoryJumpPill";
import { resolveImage } from "@/lib/image-resolver";

type MenuItem = any;

import { SearchBarPill } from "@/components/SearchBarPill";
import { OfferCarousel } from "@/components/OfferCarousel";
import { FloatingCategoriesButton } from "@/components/Menu/FloatingCategoriesButton";

export function Menu(): JSX.Element {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("/api/menu?limit=1000"); // Fetch all items

        if (!response.ok) {
          console.warn(`Menu fetch returned HTTP ${response.status} ${response.statusText}`);
          setMenu(canonicalMenu as MenuItem[]);
          return;
        }

        const data = await response.json();
        const items = data?.payload?.items ?? [];

        // Sanity check: fallback if data is empty or only has one category
        const categories = new Set(items.map(i => i.category));
        if (items.length === 0 || categories.size <= 1) {
          console.warn("API returned suspicious data (empty or single category). Falling back to canonical menu.");
          setMenu(canonicalMenu as MenuItem[]);
        } else {
          setMenu(items);
        }
      } catch (err) {
        console.error("Failed to fetch or parse menu, falling back to canonical data", err);
        setMenu(canonicalMenu as MenuItem[]);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    if (!menu || menu.length === 0) {
      setCategories([]);
      return;
    }
    const all = Array.from(
      new Set(menu.map((it) => ((it.category || "Uncategorized") as string).trim()))
    ).filter(Boolean);
    const sorted = sortCategories(all);
    setCategories(sorted);
  }, [menu]);

  useEffect(() => {
    const slug = sessionStorage.getItem("scrollToSlug");
    if (!slug) return;

    let retries = 10;
    const findAndScroll = () => {
      const element = document.getElementById(slug);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        sessionStorage.removeItem("scrollToSlug");
      } else if (retries > 0) {
        retries--;
        requestAnimationFrame(findAndScroll);
      }
    };

    findAndScroll();
  }, [menu]);

  const itemsWithResolvedImages = useMemo(() => {
    const mapped = (menu || []).map((it) => ({
      ...it,
      resolvedImage: resolveImage(it),
    }));
    return sortMenuItems(mapped);
  }, [menu]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return itemsWithResolvedImages;
    }
    return itemsWithResolvedImages.filter(item =>
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [itemsWithResolvedImages, searchQuery]);

  const groupedMenu = useMemo(() => {
    return categories.map(category => ({
      category,
      items: filteredItems.filter(item => (item.category || "Uncategorized").trim() === category),
    })).filter(group => group.items.length > 0);
  }, [categories, filteredItems]);

  const { addToCart } = useCartStore();

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
  };

  const handleCategorySelect = (category: string) => {
    const element = document.getElementById(slugify(category));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };



  return (
    <div className="w-full min-h-screen bg-app-background">
      <MetaTags
        title="Menu - Browse Our Delicious Selection"
        description="Explore our complete menu featuring authentic Arabian Mandi, Chicken Biryani, grilled Kebabs, fresh Shawarma, and traditional desserts. Order online for delivery."
      />
      <JsonLD type="menu" />
      <Toolbar onSearch={setSearchQuery} initialQuery={searchQuery} />

      <OfferCarousel />

      {searchQuery && groupedMenu.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No dishes found matching "{searchQuery}"</div>
      ) : (
        groupedMenu.map(({ category, items }, index) => (
          <div key={category || `category-${index}`} id={slugify(category)}>
            <h2 className="menu-category-heading text-app-foreground font-semibold text-lg px-4 py-2" data-category={category}>{category}</h2>
            <MenuGrid
              items={items}
              onAddToCart={handleAddToCart}
              paginate={false}
              CardComponent={MenuCardFlat}
            />
          </div>
        ))
      )}
      <FloatingCategoriesButton categories={categories} onSelectCategory={handleCategorySelect} />

      <div className="h-[49px]" />
      <BottomNav />
    </div>
  );
}

export default Menu;
