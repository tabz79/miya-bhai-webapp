import { useStickyCategory } from '@/hooks/useStickyCategory';

export function StickyCategory() {
  const activeCategory = useStickyCategory();

  if (!activeCategory) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[56px] left-0 right-0 z-40 bg-background/90 backdrop-blur-sm shadow-md"
    >
      <div className="px-3.5 py-2">
        <h2 className="font-bold text-lg text-foreground">{activeCategory}</h2>
      </div>
    </div>
  );
}
