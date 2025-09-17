## 2025-09-16 Backlog Reconciliation

### Epic: Backend API Foundation ✅

**Story: Implement Liveness & Readiness Route and Menu Routes**
- **Description:** Set up initial backend API skeleton to support frontend integration. Includes implementing a basic liveness/readiness check endpoint and mock menu routes. These routes will return mock data for now, but must follow the agreed JSON schema for future extension.
- **Acceptance Criteria:**
    - `GET /api/health` returns JSON with status, time, db (mocked), cache (mocked), version.
    - `GET /api/menu` returns a paginated list of menu items from a mock JSON source.
    - `GET /api/menu/{id}` returns a single menu item by id from the mock source.
    - Query params `page` and `limit` are validated.
    - Responses include proper status codes and JSON schema (status + payload).
    - Jest/Playwright (or similar) tests confirm all three routes respond as expected.
    - Routes are mounted under `/api` prefix in Express server.
- **Status:** ✅ Done

### Epic: Home Screen Fixes & Enhancements ✅

**Story: Implement HeroCarousel Functionality**
- **Description:** Add multiple images support, indicators, and auto-scroll. Current Hero has only one image and no slots.
- **Acceptance Criteria:**
    - HeroCarousel can display multiple images, auto-plays (~4500ms), shows indicators, and allows manual slide change.
- **Status:** ✅ Done

**Story: Fix Hero Shadow Styling**
- **Description:** “Nizam’s Royal Flavours” text block has a weird framed box. Match Figma: subtle drop shadow effect, consistent with “Perfected since 1960.”
- **Acceptance Criteria:**
    - Shadow matches Figma, no unwanted box backgrounds.
- **Status:** ✅ Done

**Story: Add Signature Best Seller Heading & Controls**
- **Description:** Signature Best Seller section missing its heading and navigation controls.
- **Acceptance Criteria:**
    - Heading visible, horizontal strip scrolls with prev/next buttons, swipe supported.
- **Status:** ✅ Done

**Story: Fix DeliveryAd Layout & Image Quality**
- **Description:** Delivery ad card does not stretch full width, delivery guy image is blurry.
- **Acceptance Criteria:**
    - Card stretches edge-to-edge within page container, delivery image crisp, responsive.
- **Status:** ✅ Done

**Story: Fix MenuGrid Layout to 4x2**
- **Description:** Current menu grid shows only 4 cards. Enforce strict 4×2 layout with placeholders if fewer items.
- **Acceptance Criteria:**
    - Grid always displays 8 slots (4 columns × 2 rows), each card matches size spec.
- **Status:** ✅ Done

### Epic: Menu 🟡

**Story: PO: Menu Redesign — Remove duplicate search & adopt Swiggy-like card layout**
- **Owner:** PO
- **Priority:** must
- **Status:** 🟡 Active / In Dev
- **Description:** PO added a redesign approach; follow Swiggy-like menu layout. Do the work in two sequential tasks:
  1. Remove the duplicate search box that appears **after** the auto-scroll poster/frame on `/menu`. Reason: there is an existing header search (top-right) next to the logo — keep that and remove the redundant one to save vertical space.
     - Acceptance: The secondary search input is removed; header search remains functional; no orphaned ARIA/label refs; no console errors.
  2. MenuCard redesign — swap to single-row cards (like Swiggy):
     - Layout: single-row per dish. **Left** side: dish name (prominent) + small one-line summary placeholder (description to be populated later). **Right** side: dish image (aspect-ratio container) with an **ADD** button near/overlap the image area or to its right—visible and tappable on mobile. Quantity editing comes in a later story.
     - Acceptance: Cards render one per row, image on right, ADD CTA visible, basic responsiveness maintained, no layout shift.
- **Notes:** Keep changes minimal and incremental. Do not refactor unrelated components.
- **Tags:** epic:menu, priority:must, design:swiggy-ref

**Story: Wire frontend to Cloudinary and migrate 61 menu images**  
- **Description:** Prepare the frontend to consume CDN-backed menu images and migrate local raw images to Cloudinary. Ensure images are served as rounded rectangles and circular avatars at high densities (4x/5x/6x). Keep originals intact in `client/src/assets/raw`. Provide deterministic public IDs to avoid rework.  
- **Acceptance Criteria:**
  - `client/src/data/images-map.json` exists and maps `basename` → `{ public_id, url }`.
  - All raw images from `client/src/assets/raw` are uploaded to Cloudinary under `menu/<slug>`.
  - Frontend component `MenuImageCloudinaryHighRes.tsx` exists and produces Cloudinary `srcset` for 4x/5x/6x densities and proper radius params for card/avatar variants.
  - `MenuCard.tsx` looks up `images-map.json` and renders CDN images when a `public_id` exists; otherwise falls back to `item.image` or `/images/fallback-food.jpg`.
  - Dev server renders a sample of menu cards from Cloudinary transforms on visual check.
- **Status:** 🟡 In Dev (Uploads done; frontend wiring partial)
- **Notes / Implementation Artifacts**
  - Scripts available: `scripts/generate-images-map-placeholders.mjs`, `scripts/test-upload.mjs`, `scripts/upload-images-to-cloudinary.mjs`.
  - `client/src/data/images-map.json` backup `.bak` is present.
- **Next Steps (Dev Audit)**
  1. Verify slug generation consistency between uploader and `MenuImageCloudinaryHighRes`.
  2. Confirm `images-map.json` is bundled/served to the client at runtime (import/public path).
  3. Make `CLOUD_NAME` & base URL configurable via `.env` / `import.meta.env`.
  4. Revisit fallback lookup order in `MenuCard`: `imagesMap[item.id]` → `item.imageUrl` → `item.image` → `item.image_url` → fallback.
  5. Add an integration test comparing `images-map.json` keys vs menu data keys (CI threshold for mismatch).

**Story: Home Button Menu Grid — Image-filtered 4×2 with Arrow Pagination**  
- **Description:** Home page shows a category dropdown (populated dynamically from API or images-backed data). For the selected category show only dishes that have images in a 4×2 grid (8 visible). Provide left/right arrow controls in the same menu row (and keyboard support) to page through that category’s items in sets of 8.  
- **Acceptance Criteria:**
- Category dropdown is populated dynamically from categories in `GET /api/menu`.  
- If API call fails, fallback categories are parsed from local `data/menu.json` (if accessible in client bundle).  
- As last resort, fallback to a minimal static list (no dependency on `mockData.ts`).  
  - Home grid filters to `itemsWithImages = items.filter(i => imagesMap[i.id] || i.imageUrl || i.image || i.image_url)` before paging.
  - Grid shows 8 visible slots (4 columns × 2 rows). If <8 items exist, render placeholders to preserve layout.
  - Arrow controls in the menu row move to next/prev page of 8 items for the selected category; keyboard left/right does the same while grid is focused. No wrap-around paging.
  - Unit tests (Jest + RTL) verify page advance logic, keyboard navigation, and image fallback behavior.
- **Status:** ✅ Done
- **Files to change / create:**
  - `client/src/pages/Home.tsx` — fetch + fallback + category dropdown + itemsWithImages filter.
  - `client/src/components/Menu/MenuGrid.tsx` — use pre-filtered `itemsWithImages` for Home; preserve existing slicing logic.
  - `client/src/components/Menu/MenuCard.tsx` — unified image fallback & `onError` handler.
  - `client/src/lib/category-mapper.ts` — canonical category order & mapping helper.
  - `src/__tests__/MenuGrid.home.test.tsx` — RTL tests for paging & keyboard navigation.
- **Next Steps (Dev Audit)**
  1. Confirm backend/frontend image field names and make lookup tolerant.
  2. Ensure dropdown ordering via `CANONICAL_CATEGORY_ORDER`.
  3. Add visual placeholders for empty slots and proper focus management for keyboard nav.

**Story: Menu Page — Full Catalog, Grouped & Ordered**  
- **Description:** Menu page must render the entire catalog (no truncation) grouped by category and presented in `CANONICAL_CATEGORY_ORDER`. Provide search across name/sku/tags.  
- **Acceptance Criteria:**
  - `/menu` page fetches `/api/menu` and renders every item grouped by `category`.
  - Category order respects `CANONICAL_CATEGORY_ORDER` (others appended alphabetically).
  - No `.slice(...)` truncation applied when rendering the Menu page.
  - Search input filters across `name`, `sku`, and `tags`.
- **Status:** ⏳ To Do (P0)
- **Files to change / create:**
  - `client/src/pages/Menu.tsx` — fetch + grouping + search.
  - `client/src/components/Menu/MenuGrid.tsx` — ensure full-list rendering on Menu page.
- **Next Steps (Dev Audit)**
  1. Remove or guard any hard-coded `.slice(0,4)` or similar in components used by Menu page.
  2. Add `sortCategories()` unit test validating ordering logic.

**Story: Image Mapping & Seed Script**  
- **Description:** Create `scripts/seed-images.ts` to map local filenames → `data/menu.json` `imageUrl` fields via slug heuristics and produce `data/menu.seeded.json` for review; flag ambiguous matches for manual resolution.  
- **Acceptance Criteria:**
  - `scripts/seed-images.ts` exists and produces `data/menu.seeded.json`.
  - Mapping accuracy >= 90% by filename heuristics; ambiguous entries captured in `data/mapping-review.json`.
  - After review, commit `data/menu.json` or `data/menu.seeded.json` as the authoritative data source.
- **Status:** ⏳ To Do (DevOps)
- **Next Steps (Dev Audit)**
  1. Provide list of filenames from `client/src/assets/raw` (or upload zip); run seeder locally and inspect `mapping-review.json`.
  2. After review, update `data/menu.json` and confirm images display.

**Story: Tests & CI**  
- **Description:** Add unit & integration tests for critical menu flows; add a lightweight CI job to run tests on PRs.  
- **Acceptance Criteria:**
  - Unit tests in `src/__tests__` covering MenuGrid (#items, paging), MenuCard (image fallback) exist.
  - E2E skeleton (Playwright/Cypress) tests Home paging flow and Menu search.
  - CI runs unit tests on PRs.
- **Status:** ⏳ To Do
- **Next Steps**
  - TesterAgent S3 to add tests; DevOps S5 to add CI job.

### Epic: Implement Missing Components ⏳

**Story: Implement OfferCarousel on Menu Page**
- **Description:** An auto-scrolling offer carousel is required on the menu page, above the menu categories, to display promotional posters.
- **Acceptance Criteria:**
    - A `OfferCarousel.tsx` component is created and placed on the `Menu.tsx` page.
    - The carousel auto-scrolls through a series of offer images.
    - The component is visually consistent with the design specifications.
- **Status:** ⏳ Backlog

### Epic: Profile Page ⏳

**Story: Implement About & Settings Section in Profile**
- **Description:** Create an About/Settings screen under Profile. Includes: About Miya Bhai Food Court (brand story, legacy, mission), App Version info (e.g., 1.0.0), General Settings toggles (Push Notifications on/off, Dark Mode toggle as future placeholder), Legal links (Terms of Service, Privacy Policy, Refund Policy), and Social media links (Instagram, Facebook, etc.).
- **Acceptance Criteria:**
    - Accessible via Profile tab.
    - About text visible, scrollable.
    - Version number displayed.
    - Toggles present and interactive.
    - Legal/social links functional.
    - Matches brand colors and typography tokens.
- **Status:** ⏳ Backlog

### Epic: Fix Incorrect Implementations ⏳

**Story: Implement SearchBarPill Interaction**
- **Description:** The `SearchBarPill` component needs to be implemented with an inline expand/collapse behavior.
- **Acceptance Criteria:**
    - The `SearchBarPill` has a fixed size of 180x36px with a 20px border-radius.
    - The component expands inline on click to reveal a search input.
    - A search icon is displayed on the right, which triggers the search.
- **Status:** ⏳ Backlog

**Story: Fix BottomNav Styling and Behavior**
- **Description:** The `BottomNav` component has incorrect height and color, and may have accessibility issues with nested links.
- **Acceptance Criteria:**
    - The `BottomNav` has a fixed height of 49px.
    - The component uses the correct brand colors from the theme.
    - A cart badge is visible on the cart icon when items are in the cart.
    - There are no nested `<a>` tags inside `<Link>` components.
- **Status:** ⏳ Backlog

### Epic: Asset Hygiene ⏳

**Story: Optimize and Standardize Image Assets**
- **Description:** Image assets are not optimized, leading to poor performance. They also have inconsistent naming and formats.
- **Acceptance Criteria:**
    - All images in the `assets` directory are compressed and optimized for the web.
    - Images are converted to modern formats like WebP where appropriate.
    - A consistent naming convention is applied to all image files.
- **Status:** ⏳ Backlog

**Story: Remove Unused Figma Assets**
- **Description:** The `client/public/figmaAssets` directory contains raw, unused assets from Figma. These should be removed to keep the project clean.
- **Acceptance Criteria:**
    - The `client/public/figmaAssets` directory is deleted.
    - All necessary assets are confirmed to be located in `src/assets` or a similar processed assets folder.
- **Status:** ⏳ Backlog

### Epic: AI Discoverability ⏳

**Story: Add Structured Data (JSON-LD), Sitemap, and robots.txt**
- **Description:** The application is missing structured data, a sitemap, and a `robots.txt` file, which are crucial for search engine optimization and AI-driven discovery.
- **Acceptance Criteria:**
    - A `JsonLD.tsx` component is implemented to dynamically generate `Restaurant` schema markup.
    - The schema includes details like restaurant name, address, phone number, and menu URLs.
    - A `sitemap.xml` file is generated and placed in the `public` directory.
    - A `robots.txt` file is created and configured in the `public` directory.
- **Status:** ⏳ Backlog

**Story: Implement Meta Tags for SEO**
- **Description:** Core SEO meta tags (title, description) are missing or not optimized. Each page should have unique and descriptive meta tags.
- **Acceptance Criteria:**
    - A `MetaTags.tsx` component is created to manage page-specific meta tags.
    - Each page (`Home`, `Menu`, etc.) has a unique, descriptive title and meta description.
    - Open Graph and Twitter card meta tags are included for better social sharing.
- **Status:** ⏳ Backlog

**Story: Implement FAQ Page and Summary Blocks**
- **Description:** As per the PRD, an FAQ page with summary block sections needs to be created to answer common customer questions.
- **Acceptance Criteria:**
    - A new page `FAQ.tsx` is created and linked in the application.
    - The page contains a list of frequently asked questions and answers.
    - The questions are displayed in expandable/collapsible summary blocks.
- **Status:** ⏳ Backlog

### Epic: PWA Features ⏳

**Story: Implement Web App Manifest**
- **Description:** Create and configure the `manifest.json` file to define the PWA's metadata, including its name, icons, theme color, and display mode. This is a core requirement for the app to be installable, as stated in `PRD.md`.
- **Acceptance Criteria:**
    - A `manifest.json` file is created and linked in `index.html`.
    - The manifest includes `short_name`, `name`, `start_url`, `display: 'standalone'`, and `theme_color`.
    - It references a set of icons of various sizes (e.g., 192x192, 512x512) for the home screen icon.
    - The theme color and background color match the brand colors from `tokens.json`.
- **Status:** ⏳ Backlog

**Story: Implement Service Worker for Caching**
- **Description:** Create a service worker to cache static assets (CSS, JS, images) and provide an offline application shell. This enables the app to load instantly and work offline, a key goal of the PWA approach mentioned in `PRD.md`.
- **Acceptance Criteria:**
    - A service worker file is created and registered successfully.
    - On first visit, the service worker caches critical assets (app shell, static assets).
    - When offline, the app loads a cached version of the application shell instead of a browser error page.
    - Subsequent visits use cached assets for faster load times.
- **Status:** ⏳ Backlog

**Story: Add "Add to Home Screen" Install Prompt**
- **Description:** Implement the logic to prompt the user to install the PWA on their device ("Add to Home Screen"). This makes the app easily accessible, fulfilling the PWA goals in `PRD.md`.
- **Acceptance Criteria:**
    - The app listens for the `beforeinstallprompt` event.
    - A custom button or UI element is shown to the user to trigger the installation prompt.
    - The installation prompt is successfully shown when the user interacts with the custom UI.
    - The custom UI is hidden after the prompt is shown or if the app is already installed.
- **Status:** ⏳ Backlog

**Story: Achieve PWA Compliance**
- **Description:** Ensure the application meets the baseline criteria for a Progressive Web App and passes automated audits. This validates the PWA implementation as per `PRD.md`.
- **Acceptance Criteria:**
    - The app is served over HTTPS.
    - The app is responsive and mobile-first.
    - The app provides a valid `manifest.json`.
    - The app registers a service worker that provides an offline shell.
    - Google Lighthouse PWA audit score is 90 or higher.
- **Status:** ⏳ Backlog
