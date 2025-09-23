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

type MenuItem = any;

const imagesMap = (imagesMapRaw as Record<string, any>) || {};
const CLOUD_NAME =
  import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env?.VITE_CLOUD_NAME ||
  null;

const slugify = (s?: string) =>
  (s || "")
    .toString()
    .normalize?.("NFKD")
    .replace(/[[\u0300-\u036F]]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const buildCloudinaryUrlFromPublicId = (publicId: string | undefined | null) => {
  if (!publicId) return null;
  if (!CLOUD_NAME) return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
};

const findImageEntryFor = (item: MenuItem) => {
  if (!item) return null;
  const candidates: string[] = [];
  if (item.id) candidates.push(String(item.id));
  if (item.sku) candidates.push(String(item.sku));
  if (item.name) candidates.push(slugify(item.name));

  const imageField = item.imageUrl || item.image || item.image_url || "";
  if (typeof imageField === "string" && imageField.length) {
    const parts = imageField.split("/").pop()?.split("?")[0] || "";
    const nameOnly = parts.replace(/\.[a-zA-Z0-9]+$/, "");
    if (nameOnly) candidates.push(nameOnly);
  }

  for (const key of candidates) {
    if (imagesMap[key]) return { key, entry: imagesMap[key] };
  }

  if (item.name) {
    const mk = `menu/${slugify(item.name)}`;
    if (imagesMap[mk]) return { key: mk, entry: imagesMap[mk] };
  }

  let bestKey: string | null = null;
  let bestScore = 0;
  const tokens = new Set((slugify(item.name) || "").split("-").filter(Boolean));
  Object.keys(imagesMap).forEach((k) => {
    const kt = new Set(k.split(/[^a-z0-9]+/).filter(Boolean));
    const inter = [...tokens].filter((t) => kt.has(t)).length;
    if (inter > bestScore) {
      bestScore = inter;
      bestKey = k;
    }
  });
  if (bestScore > 0 && bestKey) {
    return { key: bestKey, entry: imagesMap[bestKey], approxScore: bestScore };
  }
  return null;
};

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
    const unmatched: string[] = [];
    const mapped = (menu || []).map((it) => {
      const found = findImageEntryFor(it);
      let resolved: string | null = null;

      if (found && found.entry) {
        resolved = found.entry.url || found.entry.imageUrl || null;
        if (!resolved && found.entry.public_id) {
          const built = buildCloudinaryUrlFromPublicId(found.entry.public_id);
          if (built) resolved = built;
        }
      }
      if (!resolved) resolved = it.imageUrl || it.image || it.image_url || null;
      if (!resolved && it.localImagePath) resolved = it.localImagePath;

      if (!resolved) unmatched.push(it.name || it.id || "unknown");
      return { ...it, resolvedImage: resolved };
    });

    if (unmatched.length) {
      console.info("[image-resolver] Unmatched items:", unmatched.slice(0, 30));
      if (!CLOUD_NAME) {
        console.warn("[image-resolver] CLOUD_NAME not set.");
      }
    }
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
  const handleAddToCart = (item: MenuItem) => addToCart(item);

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

  const handleResultClick = (item: MenuItem) => {
    const itemSlug = slugify(item.title || item.name || item.id || item.sku);
    window.location.assign(`/menu?q=${encodeURIComponent(searchQuery)}#${itemSlug}`);
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
