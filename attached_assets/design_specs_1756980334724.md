# Design Specifications (v1)

**Source files:**
- `figmaCSS.txt` (layer CSS from Figma)
- `tokens.json` (design tokens)

---

## 1. Global Design Rules
- **Viewport:** Locked to 393px width (mobile-first). Desktop uses a **scale wrapper** for readability (no stretching).
- **Typography, colors, shadows:** Derived from `tokens.json`.
- **Assets:** Must use exported Figma images with exact filenames (e.g., `hero-01.webp`, `delivery-guy.png`).
- **Shapes:** All pills, circular buttons, and cards must match Figma CSS specs.

---

## 2. Tokens Mapping

**Colors (from tokens.json):**
- Background Beige: `#EDE9E4`
- Foreground / Text Primary: `#000000`
- BestSeller Section Background: `#4E4739`
- Brand Colors: Tuatara `#3c3c3b`, Teak `#ae905c`, Tobacco Brown `#675b46`, Go Ben `#746d52`

**Effects:**
- SearchBox Shadow: `0px 1px 4px rgba(0,0,0,0.25)`
- Card Shadow: `0px 2px 8px rgba(0,0,0,0.10)`

**Sizes:**
- Toolbar Height: 56px
- Hero Frame: 393×215
- Hero Image: 210×95 inside 230×114 holder
- SearchBarPill: 180×36 (radius 20px)
- BestSellers Section: 137px
- BestSeller Card: 60×100 (radius 95px)
- DeliveryAd: 104px, image 96×83
- MenuCard: 80×110, image 80×82, radius 18px
- BottomNav: 49px

---

## 3. Component-Level Specs

### Toolbar
- **Component:** `Toolbar`
- Height: 56px
- Left: logo (70×44)
- Right: `SearchBarPill`

### SearchBarPill
- Dimensions: 180×36
- Radius: 20px
- Placeholder: "Search dishes" (70×17)
- Icon: magnifying glass (lucide `Search`) aligned right
- Behavior: expands inline on focus, collapses on blur

### HeroCarousel
- Frame: 393×215
- Images: at least 1 now; must support ≥3 with auto-scroll (interval ~4500ms)
- Slide: image 210×95 in 230×114 holder
- Indicators: modern dots/pill; active highlighted
- Nav: circular buttons (32×32, lucide `ChevronLeft/Right`)

### BestSellersStrip
- Height: 137px
- Background: dark (`#4E4739`)
- Layout: horizontal scroll
- Cards: 60×100, radius 95px, gap 15px, shrink-0
- Nav: circular buttons left/right (32×32) + swipe support

### DeliveryAd
- Height: 104px
- Background: white, card shadow
- Right: delivery-guy image (96×83)

### MenuHeader
- Contains: Title + CategoryPill + DropdownToggleButton + GridNavigationButtons
- CategoryPill: 60×20, radius 53px, text category
- DropdownToggleButton: circular chevron-down
- GridNavigationButtons: circular left/right

### MenuGrid
- Layout: 4×2 grid = 8 MenuCards
- Card: 80×110, image 80×82, name, price
- AddToCartButton: circular mini (20×20, lucide `Plus` or `ShoppingCart`)
- If category has >8 dishes → allow horizontal paging/scroll

### BottomNav
- Height: 49px
- Items: Home, Menu, Cart, Profile (lucide icons)
- Active item highlighted, Cart shows badge

### MenuExplorer (Menu Page)
- OfferCarousel: auto-scroll posters at top
- Categories: CategoryPill + DropdownToggleButton for all categories (Main Course, Starters, Desserts, etc.)
- Grid layout mirrors Home MenuGrid; supports long lists

### Cart Page
- Shows added items, qty stepper, price, taxes, total, checkout button

### Profile Page
- User details + restaurant story (About). Home shows teaser only, link to full story.

---

## 4. AI Discoverability Requirements
- Schema.org JSON-LD: `Restaurant`, `Menu`, `MenuSection`, `MenuItem`, `Offer`
- Dedicated FAQ page + Summary sections for AI assistants
- HTML/meta cleanup (titles, descriptions, OG/Twitter tags)
- Sitemap + robots.txt
- Google Search Console submission & manual indexing
- AI assistant search testing (ChatGPT, Gemini, Bing AI)

---

## 5. Acceptance Criteria
- Layout strictly respects dimensions in tokens/figmaCSS
- All placeholders replaced by named components (no raw shapes)
- Images load from `assets/` with exact names
- Auto-scroll working for HeroCarousel and OfferCarousel
- Horizontal scroll working for BestSellersStrip and MenuGrid with nav buttons
- AI discoverability measures implemented
