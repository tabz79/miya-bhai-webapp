# Product Requirements Document (PRD) — Miya Bhai Web App

**Date:** 2025-09-04  
**Version:** v3

---

## 1. Purpose
The Miya Bhai Web App is a modern mobile-first PWA designed to showcase Miya Bhai Food Court’s brand, enable browsing of menu items, ordering, cart/checkout, and profile engagement. It differentiates itself by blending robust functionality with a clean, Figma-inspired design system and strong AI discoverability.

---

## 2. Target Audience
- Foodies exploring dishes (mobile-first users)
- Returning customers (cart, profile, repeat orders)
- Search engines and AI assistants (ChatGPT, Gemini, Bing AI) for discoverability

---

## 3. Guiding Principles
- **Mobile-first**: locked 393px width frame with desktop scale wrapper
- **Pixel precision**: dimensions and tokens from Figma (via `design_specs.md`)
- **Consistency**: circular buttons, pill selectors, uniform shadows
- **Future-proofing**: scope to expand hero carousel, bestsellers, categories
- **AI discoverability** baked in

---

## 4. User Flow
1. User lands on **Home** → sees toolbar, hero carousel, best sellers, delivery ad, signature menu.
2. Navigates via **BottomNav** → Menu (detailed), Cart, Profile.
3. In **Menu**, browses categories and offer posters.
4. Adds items to **Cart** → checks out.
5. In **Profile**, views details and restaurant story.

---

## 5. Features

### 5.1 Home Page
- **Toolbar** with SearchBarPill
- **HeroCarousel** (1 image now, ≥3 future)
- **BestSellersStrip** (4 cards now, scalable)
- **DeliveryAd** with delivery guy image
- **MenuHeader** + **MenuGrid** (8 cards, expandable)
- **BottomNav**

### 5.2 Menu Page
- **OfferCarousel** with posters (auto-scroll)
- **MenuExplorer** with categories (Main Course, Starters, Desserts, etc.)
- Detailed grids for each category

### 5.3 Cart Page
- Line items, qty control, subtotal, taxes, total
- Checkout CTA

### 5.4 Profile Page
- User info, order history (stub)
- **About/Story** of Miya Bhai Food Court (full narrative)
- Home shows short teaser + link to Profile → About

---

## 6. Components (must be implemented by name)
- **SearchBarPill**
- **HeroCarousel**, `HeroSlide`, **CarouselIndicators**, **CarouselNavigationButtons**
- **BestSellersStrip**, `BestSellerCard`, **ScrollControlButtons**
- **MenuHeader**, **CategoryPill**, **DropdownToggleButton**, **CategoryDropdown**, **GridNavigationButtons**
- **MenuGrid**, `MenuCard`, **AddToCartButton**
- **OfferCarousel** (Menu page)
- **BottomNav**

---

## 7. Data Handling
- Use `mockData.ts` for now (dishes, categories, bestsellers, branches)
- BestSellersStrip supports >4 items (scroll + nav)
- MenuGrid supports >8 items (paging/scroll)
- Categories dynamic; no hardcoding

---

## 8. AI Discoverability
- Schema.org JSON-LD: Restaurant, Menu, MenuSection, MenuItem, Offer, Branch
- FAQ page + Summary blocks
- Clean HTML/meta, OG/Twitter tags
- Sitemap + robots.txt
- Google Search Console submission + manual indexing
- Test via ChatGPT, Gemini, Bing AI

---

## 9. Acceptance Criteria
- Pixel-accurate layout (per `design_specs.md`)
- Responsive scaling on desktop (no stretch)
- HeroCarousel + OfferCarousel auto-scroll
- BestSellersStrip scrolls/swipes + circular nav buttons
- Menu categories dynamic, expandable
- Cart reflects added items + updates badge
- Profile includes restaurant story
- AI discoverability measures visible in source

---

## 10. Non-Goals
- Payment gateway integration (future)
- Loyalty program (future)
- Admin dashboards (future)

---

## 11. Risks
- Dependency on correct token mapping
- Asset export accuracy (naming mismatches break builds)
- AI discoverability requires ongoing SEO upkeep

---
## 12. Tech Stack (Free-first Approach)

- **Frontend:** React + Vite, styled with Tailwind (tokens wired from `tokens.json`), lucide-react icons, wouter routing.  
- **Hosting:** Cloudflare Pages (Free) — global CDN, effectively no hard cap for early usage.  
- **Backend:** None initially (serverless-less approach). Frontend communicates directly with DB via SDK.  
- **Database/Auth/Storage:** Supabase (Free) — PostgreSQL + Auth + File Storage.  
- **Assets:** `src/assets/` served via Cloudflare Pages or Supabase Storage.  
- **ORM (Phase 2 onward):** Drizzle (for local Postgres/Express).  
- **Dev Tools:** Vite for fast builds, Docker (local DB in Phase 2), Git for repo management.  

---

## 13. Development Phases

**Phase 1 — UI Shell (In Progress)**  
- Build pixel-accurate UI from Figma (393px mobile frame + desktop wrapper).  
- Use `mockData.ts` only (dishes, categories, bestsellers, branches).  
- Deliverable: UI matches design specs with working component interactions.

**Phase 2 — Local Backend & DB**  
- Set up Express server + Postgres (via Docker).  
- Migrate `mockData.ts` into DB, expose API endpoints with Drizzle ORM.  
- Deliverable: client + server + local DB integrated.

**Phase 3 — Cloud Deploy (Beta)**  
- Frontend on Cloudflare Pages, DB/Auth/Storage on Supabase (Free).  
- No backend initially (direct Supabase SDK calls).  
- Deliverable: public beta URL + analytics.

**Phase 4 — Business Features**  
- Payments, full auth, order tracking, push notifications.  
- Deliverable: production-ready ordering flow.

**Phase 5 — AI Discoverability & SEO**  
- Schema.org JSON-LD, FAQ, sitemap, robots.txt, GSC submission.  
- Deliverable: app discoverable by ChatGPT, Gemini, Bing, Google.

**Phase 6 — Scale & Harden**  
- Monitoring (Sentry), caching, image CDN (Cloudflare R2), security reviews.  
- Deliverable: stable, scalable v1.0.

---

## 14. Design Contract v3 (2025-09-04)
See `design_specs.md` for detailed component sizes, tokens, and CSS rules. This section is binding for Replit Agent builds.
