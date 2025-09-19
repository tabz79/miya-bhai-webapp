// client/src/hooks/useStickyCategory.ts
import { useEffect, useRef, useState } from "react";

type Opts = {
  selector?: string;
  rootElement?: HTMLElement | null;
  rootMargin?: string | undefined;
};

export function useStickyCategory(
  opts?: Opts,
  dependencies: React.DependencyList = []
) {
  const selector = opts?.selector ?? ".menu-category-heading";
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEntries = useRef<Map<Element, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(selector)
    );
    if (!headings.length) {
      setActiveCategory(null);
      return;
    }

    const toolbarHeight = getToolbarHeight();
    // Default rootMargin such that the "top threshold" aligns with bottom of toolbar.
    const rootMargin = opts?.rootMargin ?? `-${toolbarHeight}px 0px -70% 0px`;

    // cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const scheduleUpdate = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        // Choose the heading that is the best candidate:
        // Prefer headings whose top <= toolbarHeight (i.e., have passed under toolbar),
        // and among them choose the one closest to the toolbar (largest top value).
        // If none have passed yet, choose the first heading whose top is within viewport (closest).
        let candidate: { el: Element; top: number; fallback?: boolean } | null = null;

        for (const el of headings) {
          const rect = el.getBoundingClientRect();
          const top = rect.top;

          if (top <= toolbarHeight + 0.5) {
            // passed the toolbar — high priority
            if (!candidate || candidate.fallback || candidate.top < top) {
              candidate = { el, top };
            }
          } else {
            // not passed — keep as fallback if no passed headings
            if (!candidate) {
              candidate = { el, top, fallback: true };
            } else if (candidate.fallback && top < candidate.top) {
              // choose the nearest upcoming heading (smallest top)
              candidate = { el, top, fallback: true };
            }
            // if candidate exists and is a passed heading, keep it (higher priority)
          }
        }

        const newActive =
          candidate?.el?.getAttribute("data-category")?.trim() ||
          candidate?.el?.textContent?.trim() ||
          null;

        setActiveCategory((prev) => (prev === newActive ? prev : newActive));
      });
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          lastEntries.current.set(e.target, e);
        }
        scheduleUpdate();
      },
      {
        root: opts?.rootElement ?? null,
        rootMargin,
        threshold: [0, 0.01, 0.5, 1],
      }
    );

    headings.forEach((h) => observerRef.current?.observe(h));

    // initial compute
    scheduleUpdate();

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      lastEntries.current.clear();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // selector intentionally read-only from opts per mount; include opts to allow re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.rootElement, opts?.rootMargin, opts?.selector, ...dependencies]);

  return activeCategory;
}

/** Read toolbar height from CSS var, fallback to 56 */
function getToolbarHeight() {
  if (typeof window === "undefined") return 56;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--toolbar-height");
  const px = parseInt(v || "", 10);
  return Number.isFinite(px) && px > 0 ? px : 56;
}
