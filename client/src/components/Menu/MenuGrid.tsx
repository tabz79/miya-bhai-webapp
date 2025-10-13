import React, { useEffect, useRef } from "react";
import { MenuItem } from "@/data/mockData";

interface MenuGridProps {
  items: (MenuItem & { resolvedImage?: string })[];
  onAddToCart: (item: MenuItem) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  paginate?: boolean;
  CardComponent: React.ComponentType<{
    item: any;
    onAddToCart: (item: any) => void;
  }>;
}

export default function MenuGrid({
  items,
  onAddToCart,
  currentPage = 0,
  onPageChange,
  paginate = true,
  CardComponent,
}: MenuGridProps) {
  const itemsPerPage = 8;
  const totalPages = paginate
    ? Math.max(1, Math.ceil(items.length / itemsPerPage))
    : 1;
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => onPageChange?.(Math.max(0, currentPage - 1));
  const handleNext = () =>
    onPageChange?.(Math.min(totalPages - 1, currentPage + 1));

  useEffect(() => {
    if (!paginate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === gridRef.current) {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, paginate]);

  const currentItems = paginate
    ? items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : items;

  // 👇 decide layout style depending on CardComponent
  const isGrid = CardComponent.name === "MenuCardGrid";

  return (
    <section
      ref={gridRef}
      tabIndex={0}
      className="w-full px-3.5 py-0 relative focus:outline-none"
      aria-label="Menu List"
    >
      <ul
        className={
          isGrid
            ? "grid grid-cols-2 sm:grid-cols-4 gap-4"
            : "flex flex-col divide-y divide-gray-200"
        }
      >
        {currentItems.map((item) => (
          <li key={item.id}>
            <CardComponent item={item} onAddToCart={onAddToCart} />
          </li>
        ))}
      </ul>

      {paginate && totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="disabled:opacity-50"
          >
            &lt;
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => onPageChange?.(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPage ? "bg-brand-teak w-4" : "bg-gray-300"
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className="disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      )}
    </section>
  );
}
