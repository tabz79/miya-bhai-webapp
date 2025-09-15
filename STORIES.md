## 2025-09-06 Backlog Refinement

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
- **Status:** Done

### Epic: Home Screen Fixes & Enhancements

**Story: Implement HeroCarousel Functionality**
- **Description:** Add multiple images support, indicators, and auto-scroll. Current Hero has only one image and no slots.
- **Acceptance Criteria:**
    - HeroCarousel can display multiple images, auto-plays (~4500ms), shows indicators, and allows manual slide change.
- **Status:** Backlog

**Story: Fix Hero Shadow Styling**
- **Description:** “Nizam’s Royal Flavours” text block has a weird framed box. Match Figma: subtle drop shadow effect, consistent with “Perfected since 1960.”
- **Acceptance Criteria:**
    - Shadow matches Figma, no unwanted box backgrounds.
- **Status:** Backlog

**Story: Add Signature Best Seller Heading & Controls**
- **Description:** Signature Best Seller section missing its heading and navigation controls.
- **Acceptance Criteria:**
    - Heading visible, horizontal strip scrolls with prev/next buttons, swipe supported.
- **Status:** Backlog

**Story: Fix DeliveryAd Layout & Image Quality**
- **Description:** Delivery ad card does not stretch full width, delivery guy image is blurry.
- **Acceptance Criteria:**
    - Card stretches edge-to-edge within page container, delivery image crisp, responsive.
- **Status:** Backlog

**Story: Fix MenuGrid Layout to 4x2**
- **Description:** Current menu grid shows only 4 cards. Enforce strict 4×2 layout with placeholders if fewer items.
- **Acceptance Criteria:**
    - Grid always displays 8 slots (4 columns × 2 rows), each card matches size spec.
- **Status:** Backlog

### Epic: Menu

**Story: Wire frontend to Cloudinary and migrate 61 menu images**  
- **Description:** Prepare the frontend to consume CDN-backed menu images and migrate local raw images to Cloudinary. Ensure images are served as rounded rectangles and circular avatars at high densities (4x/5x/6x). Keep originals intact in `client/src/assets/raw`. Provide deterministic public IDs to avoid rework.
- **Acceptance Criteria:**
  - `client/src/data/images-map.json` exists and maps `basename` → `{ public_id, url }`.
  - All raw images from `client/src/assets/raw` are uploaded to Cloudinary under `menu/<slug>`.
  - Frontend component `MenuImageCloudinaryHighRes.tsx` exists and produces Cloudinary `srcset` for 4x/5x/6x densities and correct radius params for card/avatar variants.
  - `MenuCard.tsx` is patched to lookup `images-map.json` and render CDN images when a `public_id` exists; otherwise falls back to `item.image`.
  - Dev server renders at least a subset of menu cards from Cloudinary transforms (manual visual check).
- **Status:** In Progress (Uploads done; frontend wiring partial)
- **Notes / Implementation Artifacts**
  - Scripts created:
    - `scripts/generate-images-map-placeholders.mjs` — generate placeholder map from filenames.
    - `scripts/test-upload.mjs` — Cloudinary test uploader.
    - `scripts/upload-images-to-cloudinary.mjs` — batch uploader; uploaded 61 files and updated `client/src/data/images-map.json` (backup saved as `.bak`).
  - Files added/updated:
    - `client/src/components/MenuImageCloudinaryHighRes.tsx` — Cloudinary URL builder + `srcset`.
    - `client/src/data/images-map.json` — generated map file.
    - `client/src/components/Menu/MenuCard.tsx` — patched to use `images-map.json` and `MenuImageCloudinaryHighRes`.
  - Observed behaviour:
    - All 61 images uploaded successfully to Cloudinary (`menu/<slug>`). Uploader logs confirm.
    - Frontend path import issues fixed, but some cards still fall back to local `item.image`. Likely slug mismatch or cache — needs Dev audit.
- **Next Steps (Dev Audit)**
  1. Verify slug generation consistency between uploader and `MenuCard`.
  2. Restart dev server and clear HMR cache; re-test.
  3. Inspect failing card(s) in browser DevTools, confirm Cloudinary URL response.
  4. Make `CLOUD_NAME` configurable via env instead of hard-coded.
  5. Add integration test comparing `images-map.json` keys vs menu data keys.

### Epic: Implement Missing Components

**Story: Implement OfferCarousel on Menu Page**
- **Description:** An auto-scrolling offer carousel is required on the menu page, above the menu categories, to display promotional posters.
- **Acceptance Criteria:**
    - A `OfferCarousel.tsx` component is created and placed on the `Menu.tsx` page.
    - The carousel auto-scrolls through a series of offer images.
    - The component is visually consistent with the design specifications.
- **Status:** Backlog

### Epic: Profile Page

**Story: Implement About & Settings Section in Profile**
- **Description:** Create an About/Settings screen under Profile. Includes: About Miya Bhai Food Court (brand story, legacy, mission), App Version info (e.g., 1.0.0), General Settings toggles (Push Notifications on/off, Dark Mode toggle as future placeholder), Legal links (Terms of Service, Privacy Policy, Refund Policy), and Social media links (Instagram, Facebook, etc.).
- **Acceptance Criteria:**
    - Accessible via Profile tab.
    - About text visible, scrollable.
    - Version number displayed.
    - Toggles present and interactive.
    - Legal/social links functional.
    - Matches brand colors and typography tokens.
- **Status:** Backlog

### Epic: Fix Incorrect Implementations

**Story: Implement SearchBarPill Interaction**
- **Description:** The `SearchBarPill` component needs to be implemented with an inline expand/collapse behavior.
- **Acceptance Criteria:**
    - The `SearchBarPill` has a fixed size of 180x36px with a 20px border-radius.
    - The component expands inline on click to reveal a search input.
    - A search icon is displayed on the right, which triggers the search.
- **Status:** Backlog

**Story: Fix BottomNav Styling and Behavior**
- **Description:** The `BottomNav` component has incorrect height and color, and may have accessibility issues with nested links.
- **Acceptance Criteria:**
    - The `BottomNav` has a fixed height of 49px.
    - The component uses the correct brand colors from the theme.
    - A cart badge is visible on the cart icon when items are in the cart.
    - There are no nested `<a>` tags inside `<Link>` components.
- **Status:** Backlog

### Epic: Token & Theming

**Story: Implement CSS Variables for Theming**
- **Description:** The project is missing a centralized theming system. CSS variables for colors, fonts, spacing, shadows, and typography must be defined and applied globally from `tokens.json`.
- **Acceptance Criteria:**
    - A global CSS file (`src/index.css` or similar) is created with all design tokens from `tokens.json` defined as CSS variables.
    - All components are refactored to use these CSS variables instead of hardcoded values for sizes, shadows, and typography.
    - The application's theme is consistent and easily updatable from a single source.
- **Status:** Backlog

**Story: Unify Font Styles**
- **Description:** Multiple font families and sizes are used inconsistently across the application. The font styles need to be unified based on the design specifications.
- **Acceptance Criteria:**
    - All components are updated to use the font families and sizes defined in the `design_specs.md`.
    - A limited, consistent set of font styles is used throughout the application.
- **Status:** Backlog

### Epic: Asset Hygiene

**Story: Optimize and Standardize Image Assets**
- **Description:** Image assets are not optimized, leading to poor performance. They also have inconsistent naming and formats.
- **Acceptance Criteria:**
    - All images in the `assets` directory are compressed and optimized for the web.
    - Images are converted to modern formats like WebP where appropriate.
    - A consistent naming convention is applied to all image files.
- **Status:** Backlog

**Story: Remove Unused Figma Assets**
- **Description:** The `client/public/figmaAssets` directory contains raw, unused assets from Figma. These should be removed to keep the project clean.
- **Acceptance Criteria:**
    - The `client/public/figmaAssets` directory is deleted.
    - All necessary assets are confirmed to be located in `src/assets` or a similar processed assets folder.
- **Status:** Backlog

### Epic: AI Discoverability

**Story: Add Structured Data (JSON-LD), Sitemap, and robots.txt**
- **Description:** The application is missing structured data, a sitemap, and a `robots.txt` file, which are crucial for search engine optimization and AI-driven discovery.
- **Acceptance Criteria:**
    - A `JsonLD.tsx` component is implemented to dynamically generate `Restaurant` schema markup.
    - The schema includes details like restaurant name, address, phone number, and menu URLs.
    - A `sitemap.xml` file is generated and placed in the `public` directory.
    - A `robots.txt` file is created and configured in the `public` directory.
- **Status:** Backlog

**Story: Implement Meta Tags for SEO**
- **Description:** Core SEO meta tags (title, description) are missing or not optimized. Each page should have unique and descriptive meta tags.
- **Acceptance Criteria:**
    - A `MetaTags.tsx` component is created to manage page-specific meta tags.
    - Each page (`Home`, `Menu`, etc.) has a unique, descriptive title and meta description.
    - Open Graph and Twitter card meta tags are included for better social sharing.
- **Status:** Backlog

**Story: Implement FAQ Page and Summary Blocks**
- **Description:** As per the PRD, an FAQ page with summary block sections needs to be created to answer common customer questions.
- **Acceptance Criteria:**
    - A new page `FAQ.tsx` is created and linked in the application.
    - The page contains a list of frequently asked questions and answers.
    - The questions are displayed in expandable/collapsible summary blocks.
- **Status:** Backlog

### Epic: PWA Features

**Story: Implement Web App Manifest**
- **Description:** Create and configure the `manifest.json` file to define the PWA's metadata, including its name, icons, theme color, and display mode. This is a core requirement for the app to be installable, as stated in `PRD.md`.
- **Acceptance Criteria:**
    - A `manifest.json` file is created and linked in `index.html`.
    - The manifest includes `short_name`, `name`, `start_url`, `display: 'standalone'`, and `theme_color`.
    - It references a set of icons of various sizes (e.g., 192x192, 512x512) for the home screen icon.
    - The theme color and background color match the brand colors from `tokens.json`.
- **Status:** Backlog

**Story: Implement Service Worker for Caching**
- **Description:** Create a service worker to cache static assets (CSS, JS, images) and provide an offline application shell. This enables the app to load instantly and work offline, a key goal of the PWA approach mentioned in `PRD.md`.
- **Acceptance Criteria:**
    - A service worker file is created and registered successfully.
    - On first visit, the service worker caches critical assets (app shell, static assets).
    - When offline, the app loads a cached version of the application shell instead of a browser error page.
    - Subsequent visits use cached assets for faster load times.
- **Status:** Backlog

**Story: Add "Add to Home Screen" Install Prompt**
- **Description:** Implement the logic to prompt the user to install the PWA on their device ("Add to Home Screen"). This makes the app easily accessible, fulfilling the PWA goals in `PRD.md`.
- **Acceptance Criteria:**
    - The app listens for the `beforeinstallprompt` event.
    - A custom button or UI element is shown to the user to trigger the installation prompt.
    - The installation prompt is successfully shown when the user interacts with the custom UI.
    - The custom UI is hidden after the prompt is shown or if the app is already installed.
- **Status:** Backlog

**Story: Achieve PWA Compliance**
- **Description:** Ensure the application meets the baseline criteria for a Progressive Web App and passes automated audits. This validates the PWA implementation as per `PRD.md`.
- **Acceptance Criteria:**
    - The app is served over HTTPS.
    - The app is responsive and mobile-first.
    - The app provides a valid `manifest.json`.
    - The app registers a service worker that provides an offline shell.
    - Google Lighthouse PWA audit score is 90 or higher.
- **Status:** Backlog
