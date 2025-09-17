import React, { useEffect, useMemo, useState } from "react";
import { Toolbar } from "../components/Toolbar";
import { MetaTags } from "../components/MetaTags";
import { JsonLD } from "../components/JsonLD";
import { MenuHeader } from "../components/Menu/MenuHeader";
import { MenuGrid } from "../components/Menu/MenuGrid";
import { BottomNav } from "../components/BottomNav";
import canonicalMenu from "@/data/menu.canonical.json";
import imagesMapRaw from "../data/images-map.json";
import { sortCategories } from "../lib/category-mapper";
import { OfferCarousel } from "../components/OfferCarousel";

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
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const buildCloudinaryUrlFromPublicId = (publicId: string | undefined | null) => {
  if (!publicId) return null;
  if (!CLOUD_NAME) {
    return null;
  }
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

export function Menu(): JSX.Element {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("/api/menu");
        const data = await response.json();
        setMenu(data.payload.items);
      } catch (error) {
        console.error("Failed to fetch menu, falling back to canonical data", error);
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

  const itemsWithResolvedImages = useMemo(() => {
    return (menu || []).map((it) => {
      const found = findImageEntryFor(it);
      let resolved: string | null = null;

      if (found && found.entry) {
        resolved = found.entry.url || found.entry.imageUrl || null;
        if (!resolved && found.entry.public_id) {
          const built = buildCloudinaryUrlFromPublicId(found.entry.public_id);
          if (built) resolved = built;
        }
      }

      if (!resolved) {
        resolved = it.imageUrl || it.image || it.image_url || null;
      }

      if (!resolved && it.localImagePath) {
        resolved = it.localImagePath;
      }

      return { ...it, resolvedImage: resolved };
    });
  }, [menu]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return itemsWithResolvedImages;
    }
    return itemsWithResolvedImages.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [itemsWithResolvedImages, searchQuery]);

  const groupedMenu = useMemo(() => {
    return categories.map(category => ({
      category,
      items: filteredItems.filter(item => (item.category || "Uncategorized").trim() === category),
    })).filter(group => group.items.length > 0);
  }, [categories, filteredItems]);

  const handleAddToCart = (item: MenuItem) => {
    console.log("Add to cart:", item);
  };

  return (
    <div className="w-full min-h-screen bg-app-background">
      <MetaTags
        title="Menu - Browse Our Delicious Selection"
        description="Explore our complete menu featuring authentic Arabian Mandi, Chicken Biryani, grilled Kebabs, fresh Shawarma, and traditional desserts. Order online for delivery."
      />
      <JsonLD type="menu" />
      <Toolbar />
      <OfferCarousel />

      

      {groupedMenu.map(({ category, items }) => (
        <div key={category}>
          <h2 className="text-app-foreground font-semibold text-lg px-4 py-2">{category}</h2>
          <MenuGrid
            items={items}
            onAddToCart={handleAddToCart}
            paginate={false}
          />
        </div>
      ))}

      <div className="h-[49px]" />
      <BottomNav />
    </div>
  );
}
