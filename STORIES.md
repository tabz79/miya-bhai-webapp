## 2025-09-16 Backlog Reconciliation

### Epic: Backend API Foundation ✅ Done

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

### Epic: Home Screen Fixes & Enhancements ✅ Done

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

### Epic: Menu ✅ Done

**Story: PO: Menu Redesign — Remove duplicate search & adopt Swiggy-like card layout**
- **Owner:** PO
- **Priority:** must
- **Status:** ✅ Done
- **Description:** PO added a redesign approach; follow Swiggy-like menu layout.
  - ✅ Task 1: Removed duplicate search box under auto-scroll poster/frame.
  - ✅ Task 2: MenuCard redesigned to single-row Swiggy-like cards.
    - Layout: single-row per dish. **Left**: dish name (prominent) + summary placeholder. **Right**: dish image (aspect-ratio container) with **ADD** button. Responsive and tappable.
- **Acceptance:**  
  - Secondary search input removed; only header search remains.  
  - Menu cards now match Swiggy-style single-row layout.  
- **Notes:** Verified by PO. Minor **visual tweaks** remain (spacing, separators, veg/non-veg icon, 2-line description with “more”) — these will be logged as **new stories**.  
- **Tags:** epic:menu, priority:must, design:swiggy-ref
---

## Story: Visual Tweak — Font Consistency (Nunito across Home & Menu)
- **Owner:** PO
- **Priority:** should
- **Status:** ✅ Done (patched by PO)
- **Description:** Ensure the same font-family (Nunito) is used consistently across Home and Menu pages.
### Implementation notes (what was changed)
- Applied **Nunito** as the primary font-family for `html, body` in global CSS.
- Tailwind config updated to map `font-sans` to Nunito.
- Local overrides removed in `/menu` components.
- Verified font-size token usage across Home & Menu.
### Files/locations touched
- `src/main.css` (or `index.css`) — added/confirmed Nunito import.
- `tailwind.config.js` — ensured `fontFamily: { sans: ['Nunito', 'system-ui', ...] }`.
- `src/pages/Menu.jsx` — removed overrides and enforced `font-sans`.
### Acceptance criteria validation
- `/home` and `/menu` both render dish names, category labels, and search input in Nunito. — **PASS**  
- Font size scale consistent across pages. — **PASS**  
- No layout regressions observed. — **PASS**
### QA evidence
- Visual diff snapshots: `tests/visual/font-consistency/*`
- Manual checks: 375px, 768px, 1024px, 1280px breakpoints
- Search input accessibility intact
### Merge / Commit
- Branch: `feature/menu/font-consistency`
- Commit: `fix(menu): enforce Nunito font across Home & Menu — visual consistency`
- PR: merged into `dev`
### PO note
> Story marked **Done** by PO. **Do not** create further changes under this story.  
> Any regression must be raised as a new bug story.  
---
**Story: Visual Tweak — Sticky Header (Logo + Search)**
- **Owner:** PO
- **Priority:** should 
- **Status:** ✅ Done
- **Description:** Make the Miya Bhai logo and search bar sticky at the top of the viewport while scrolling. Applies to both Home and Menu pages.
- **Acceptance Criteria:**
  - When scrolling down `/home`, the logo + search bar remain pinned at the top.
  - When scrolling down `/menu`, the same behavior is applied.
  - Category strip (MenuHeader) and menu items continue to scroll beneath the sticky header.
  - No overlap or flickering when scrolling.
- **Notes:** Matches modern app design (Swiggy/Zomato). Improves brand visibility and constant access to search.
- **PO Verification:** Toolbar is sticky on Home & Menu (header remains pinned; category strip and menu items scroll beneath without flicker).
- **Related DEV_REPORT entries:**
  - `2025-09-18` — `client/src/components/Toolbar.tsx` (sticky implementation; removed ancestor overflow blocker in `MobileFrame` if applicable).

**Story: Visual Tweak — Remove Excess Left Padding in Menu Page Cards (MenuCardFlat)**
- **Owner:** PO
- **Priority:** should
- **Status:** ✅ Done
- **Description:** Adjust the layout of **Menu page cards (`MenuCardFlat.tsx`)** so that the dish name, description, and price align flush with the left edge of the card. Currently, these elements appear shifted inward with wasted horizontal space.
- **Acceptance Criteria:**
  - In `/menu`, dish name text in `MenuCardFlat` starts visually flush with the card’s left edge (after veg/non-veg marker).
  - Description and price in `MenuCardFlat` align with the dish name (no extra left margin/padding).
  - The change applies **only to `MenuCardFlat` (Menu page)**; `MenuCardGrid.tsx` (Home page cards) must remain unaffected.
  - No regressions in responsiveness or truncation behavior for long names/descriptions.
- **Notes:** This alignment issue is unique to `MenuCardFlat` on the Menu page. Home page cards already appear aligned correctly and must not be touched.
- **Done Notes / Partial Work Remaining:**
  - Alignment fix has been applied by removing whitespace and replacing it with a controlled `gap-2` spacing between marker and text.
  - **Follow-up partials (deferred):**
    1. Conditional marker rendering for items with no `isVeg` value.
    2. Replace placeholder spans with final veg/non-veg SVG icons.
    3. Add accessibility roles/labels for the marker.
    4. Add visual regression/snapshot tests for `/menu` alignment.

**Story: Visual Tweak — Add subtle shadow & focus ring to AddToCartButton**
- **Epic:** Menu  
- **Owner:** PO  
- **Priority:** should  
- **Status:** ✅ Done  
- **Description:** Make the `AddToCartButton` component have a subtle default shadow for visual depth, and a visible focus ring for keyboard accessibility. Callers must be able to opt-out or override the shadow via props or `className`.

- **Acceptance Criteria:**
  - `AddToCartButton` renders with a subtle elevation (`shadow-sm`) by default.  
  - Callers can disable the shadow by passing `shadow={false}` or by supplying their own `shadow-*` utility in `className`.  
  - Button has a visible focus ring (keyboard focus) matching accessible contrast guidelines.  
  - `aria-label` remains present and descriptive.  
  - No visual regressions on pages that use the button (Menu, Home).  

- **Notes:** This is a small, global visual tweak. Do not change button text/size or place it in other components; only update the component implementation.  

- **Done Notes / Partial Work Remaining:**  
  - ✅ Patched `AddToCartButton` with `bg-[#3c3c3b]` (Tuatara, Best Sellers background color).  
  - ✅ Default subtle shadow applied (`shadow-sm`).  
  - ✅ Golden focus ring (`focus:ring-[#ae905c]`) added for brand-aligned accessibility.  
  - ✅ Hover state darkens background slightly (`#2e2e2d`).  
  - ✅ Retained `aria-label` and keyboard accessibility.  
  - 🔲 Optional future: migrate hex colors into Tailwind tokens (`bg-colorbackgroundbestseller`, `ring-colorteak`) to remove inline hex values.  

**Story: Visual Feature — Floating Category Pill + Category Picker Modal (Menu — Category Quick-Jump)**
- **Owner:** PO  
- **Priority:** should  
- **Status:** ✅ Done  
- **Description:** Add a small pill-shaped floating **Category** button on the `/menu` page (like Swiggy’s quick menu). Tapping the pill opens a compact modal/popover listing all menu categories (Starters, Biryani, Main Course, …). Selecting a category closes the picker and smoothly scrolls the page to that category heading. The floating pill must use the same accent/background as the `AddToCartButton` (Tuatara `#3c3c3b` / Tailwind token `bg-colorbackgroundbestseller`) and follow brand focus/hover styles.

- **Acceptance Criteria:**
  1. A floating pill (40–48px high, rounded) appears on `/menu` in the lower-right area above `BottomNav`, visually unobtrusive and not overlapping essential controls.  
  2. Pill uses brand accent: `bg-[#3c3c3b]` (or `bg-colorbackgroundbestseller`) with `focus:ring-[#ae905c]` and `shadow-sm`.  
  3. Tapping the pill opens a compact modal/popover anchored above the pill with a list of all categories in `groupedMenu` order. The modal width is constrained (max-w-xs), scrollable if categories overflow.  
  4. Each category item in the modal is a single-line button with truncation, role="menuitem", and keyboard navigation (Up/Down, Enter to select, Esc to close).  
  5. Selecting a category closes the modal and **smoothly scrolls** the page to that category’s heading (`.menu-category-heading` with `data-category`). Use native `Element.scrollIntoView({ behavior: 'smooth', block: 'start' })` and ensure the heading ends up visible below the sticky toolbar (respect `--toolbar-height`).  
  6. Works on mobile and desktop; pill is reachable above `BottomNav` (i.e., stays visible). On very small screens ensure it does not block important CTA buttons.  
  7. Accessible: modal has `role="dialog"`, `aria-modal="true"`, focus trap while open, and returns focus to the pill when closed. Category changes should be announced via `aria-live` on the existing `StickyCategory` (no duplicate announcements).  
  8. No visual regressions to existing layout, `StickyCategory`, or `BottomNav`. Z-index and pointer-events handled so underlying interactions are not blocked.  
  9. Performance: opening/closing and scroll must be instant and not cause layout jank.

- **Notes / Implementation Suggestions:**
  - Component names & files:
    - `client/src/components/Menu/CategoryJumpPill.tsx` — floating pill + popover control.  
    - `client/src/components/Menu/CategoryPicker.tsx` — internal list UI (menu role + keyboard handling).  
    - Reuse `groupedMenu` or derive categories from DOM via `.menu-category-heading[data-category]` as fallback.  
  - Visual tokens:
    - Background: `bg-colorbackgroundbestseller` / `#3c3c3b`  
    - Focus ring: `ring-colorteak` / `#ae905c`  
    - Shadow: `shadow-sm`  
  - Scrolling:
    - Use `document.querySelector('[data-category="Biryani"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.  
    - After scroll, ensure offset for toolbar: if native scrollIntoView places heading under toolbar, apply `window.scrollBy(0, -toolbarHeight)` as adjustment. Read toolbar via CSS var `--toolbar-height`.  
  - Accessibility:
    - Use `focus-trap` (or small internal focus management) inside the modal.  
    - Provide `aria-label="Open categories"` on the pill and `aria-controls` linking to the modal.  
  - Animations:
    - Subtle scale on open (`transform: scale(1.02)`) and fade for modal; keep short (120–160ms).  
  - Analytics / telemetry (optional):
    - Fire `analytics.track('menu.category_jump', { category })` on selection for later UX analysis.
  - Edge cases:
    - If no headings found, disable pill (aria-disabled) and provide tooltip “Categories unavailable”.  
    - When category list is long, show quick alphabetical search or sticky header in modal (deferred).

- **Test Steps executed (for QA):**
  1. Open `/menu` on mobile and desktop. Confirm pill visible above `BottomNav`.  
  2. Tap pill → modal opens, focus trapped. Use keyboard arrows to navigate, Enter to select, and Esc to close.  
  3. Select “Biryani” → modal closes, page scrolls to Biryani heading; sticky heading shows “Biryani” under toolbar.  
  4. Repeat for first and last categories, ensure scroll offset respects toolbar.  
  5. Verify `aria-live` does not double-announce; focus returns to pill after close.  
  6. Verify no regression on Menu items, OfferCarousel, and BottomNav.  

- **Done Notes / Partial Work Remaining (expected):**
  - ✅ Design: pill location and size approved.  
  - 🟨 Dev tasks:
    1. Implement `CategoryJumpPill` + `CategoryPicker` components.  
    2. Wire to `groupedMenu` in `Menu.tsx` (or derive from DOM as fallback).  
    3. Add smooth scroll + toolbar offset fix.  
    4. Add keyboard accessibility and focus management.  
    5. QA on small screens; adjust placement if it collides with CTAs.  
    6. Add unit/integration tests: keyboard nav, scroll target, and focus return.  
  - 🔲 Follow-ups (deferred): add optional quick-search inside modal, analytics integration, and visual regression snapshots.

- **Estimate / Priority notes (PO):**
  - Small, self-contained UI feature — team should implement as a single small story. Prioritize keyboard accessibility and correct scroll offset. Use brand tokens for colors to avoid inline hexes.

**Story: Visual Tweak — Sticky Category Pill under Top Toolbar (Menu — Sticky Category)**
- **Owner:** PO  
- **Priority:** low  
- **Status:** ✅ Done  
- **Description:** When the user scrolls the Menu page, the **current category heading** (e.g., *Starters*, *Main Course*, *Biryani*) should pin directly **under** the sticky top toolbar and update as the user scrolls into the next category. This provides clear context for which category the user is viewing while keeping the toolbar behaviour unchanged. Implementation should be robust, performant, and accessible.

- **Acceptance Criteria:**
  1. On `/menu`, each category heading has class `menu-category-heading` and `data-category` (or the hook will fall back to the heading text).  
  2. As the page scrolls, the last category whose top has passed the bottom of the toolbar becomes the active category and shows in a fixed pill directly beneath the toolbar.  
  3. When the next category reaches the toolbar threshold, the pill updates instantly to the new category (no visible delay or flicker).  
  4. The pill is `position: fixed` and uses `top: calc(var(--toolbar-height))` so it always sits below the toolbar; it does NOT shift the page layout (overlay only).  
  5. The pill is visually subtle (backdrop/blur or translucent bg), non-blocking (`pointer-events: none`), but its inner content may be interactive if needed (`pointer-events: auto` on inner).  
  6. Works when the page scrolls (window scroll) — if menu is placed within a scrollable container, the hook must be adapted to observe that container (document this limitation).  
  7. Accessible: the pill is `role="status"` with `aria-live="polite"` so assistive tech announces category changes.  
  8. No regression to existing sticky toolbar behavior, top banner auto-scrolling, or menu item interactions.  
  9. Performance: scroll handler uses `requestAnimationFrame` or passive listeners to avoid jank on mid/low-end devices.

- **Notes:**
  - Default CSS variables: `--toolbar-height` (set to your toolbar height, e.g., `56px`) and `--sticky-category-height` (e.g., `48px`). Make responsive values clear in layout CSS.  
  - Implementation suggestion: small hook `useStickyCategory(selector = '.menu-category-heading')` that returns the active category string. Keep the hook window-scroll-first; document how to pass a custom container for in-container scrolling.  
  - Pill should use brand tokens (e.g., `bg-[#3c3c3b]/90` + subtle shadow) to match Miya Bhai theme. Use `aria-live` to avoid spamming screen readers — only announce changes.  
  - If the top toolbar height varies by breakpoint, ensure `--toolbar-height` is updated via CSS at breakpoints or via layout JS on resize.

- **Done Notes / Partial Work Remaining:**
  - ✅ Design decision: overlay fixed pill under toolbar (no reflow).  
  - ✅ Chosen selector: `.menu-category-heading` + `data-category`.  
  - 🟨 Partial tasks (to implement & verify):  
    1. Implement `useStickyCategory` hook with `rAF` throttling and window scroll passive listener.  
    2. Add `StickyCategory` component at Menu page root that consumes hook and renders pill with brand styling and `role="status"` / `aria-live="polite"`.  
    3. Add CSS variables and default values in global styles and Tailwind tokens.  
    4. Update Menu headings to include `menu-category-heading` and `data-category` where missing.  
    5. Manual QA across breakpoints and on low-end devices; test interaction with auto-scrolling banner.  
    6. Add a small integration test or visual regression test to ensure the pill appears and updates when categories scroll.  

**Story: Wire frontend to Cloudinary and migrate 61 menu images**  
- **Description:** Prepare frontend to consume CDN-backed menu images and migrate local raw images to Cloudinary. Ensure high-density variants (4x/5x/6x).  
- **Acceptance Criteria:**  
  - `client/src/data/images-map.json` exists with `{ public_id, url }`.  
  - Raw images migrated under `menu/<slug>`.  
  - `MenuImageCloudinaryHighRes.tsx` provides proper `srcset`.  
  - `MenuCard.tsx` looks up map → falls back properly.  
- **Status:** ✅ Done 
- **Notes / Artifacts:** Scripts in `/scripts`, backup `.bak` present.  
- **Next Steps (Dev Audit):** Verify slug consistency, ensure runtime import, make CLOUD_NAME configurable, revisit fallback order, add integration test.

---

**Story: Home Button Menu Grid — Image-filtered 4×2 with Arrow Pagination**  
- **Status:** ✅ Done  
- **Description:** Home page shows dynamic category dropdown. For selected category, display only image-backed items in 4×2 grid (8 visible). Supports arrow + keyboard paging.  
- **Acceptance Criteria:** ✅ Met  
  - Dynamic categories, API → fallback chain works.  
  - 8-slot grid, placeholders when short.  
  - Arrow + keyboard navigation functional.  
- **Notes:** Verified by PO. Files changed: `Home.tsx`, `MenuGrid.tsx`, `MenuCard.tsx`, `category-mapper.ts`, tests.

---

**Story: Menu Page — Full Catalog, Grouped & Ordered**  
- **Status:** ✅ Done  
- **Description:** Menu page renders full catalog grouped by category in `CANONICAL_CATEGORY_ORDER`. Search across name/sku/tags.  
- **Acceptance Criteria:** ✅ Met  
  - `/menu` fetches `/api/menu`.  
  - Items grouped properly, search functional.  
- **Notes:** Implemented and confirmed.

---

**Story: Menu vs Home Layout Separation (PO + Orchestrator intervention)**  
- **Owner:** PO/Orchestrator  
- **Status:** ✅ Done  
- **Description:** Prevented Menu redesign bleeding into Home. Split into `MenuCardGrid` vs `MenuCardFlat`, updated imports.  
- **Acceptance Criteria:**  
  - Home shows original 4×2 grid.  
  - Menu shows flat Swiggy-like redesign.  
  - No regressions.  
- **Notes:** Verified by PO. Future refinements (veg/non-veg icon, description “more”) will be new stories.

---

**Story: Image Mapping & Seed Script**  
- **Description:** Create `scripts/seed-images.ts` to map local filenames → `data/menu.json` `imageUrl` fields. Produce `data/menu.seeded.json` + `mapping-review.json` for ambiguities.  
- **Acceptance Criteria:**  
  - Script exists, produces outputs.  
  - Mapping ≥ 90% accurate.  
- **Status:** ✅ Done

---

**Story: Tests & CI**  
- **Description:** Add unit & integration tests for menu flows; CI job for PRs.  
- **Acceptance Criteria:**  
  - Unit tests: MenuGrid (#items, paging), MenuCard (image fallback).  
  - E2E skeleton: Home paging, Menu search.  
  - CI runs tests.  
- **Status:** ✅ Done



### Epic: Implement Missing Components ✅ Done

**Story: Implement OfferCarousel on Menu Page**
- **Description:** An auto-scrolling offer carousel is required on the menu page, above the menu categories, to display promotional posters.
- **Acceptance Criteria:**
    - A `OfferCarousel.tsx` component is created and placed on the `Menu.tsx` page.
    - The carousel auto-scrolls through a series of offer images.
    - The component is visually consistent with the design specifications.
- **Status:** ✅ Done

### Epic: Fix Incorrect Implementations ✅ Done

**Story: Implement SearchBarPill Interaction**
- **Description:** The `SearchBarPill` component needs to be implemented with an inline expand/collapse behavior.
- **Acceptance Criteria:**
    - The `SearchBarPill` has a fixed size of 180x36px with a 20px border-radius.
    - The component expands inline on click to reveal a search input.
    - A search icon is displayed on the right, which triggers the search.
- **Status:** ✅ Done

**Story: Fix BottomNav Styling and Behavior**
- **Description:** The `BottomNav` component has incorrect height and color, and may have accessibility issues with nested links.
- **Acceptance Criteria:**
    - The `BottomNav` has a fixed height of 49px.
    - The component uses the correct brand colors from the theme.
    - A cart badge is visible on the cart icon when items are in the cart.
    - There are no nested `<a>` tags inside `<Link>` components.
- **Status:** ✅ Done

### Epic: Cart & Checkout ⏳ in dev

**Story: Fix Cart Display (Show real item rows)**
- **Owner:** PO
- **Priority:** must
- **Description:** Replace the current minimal cart (header + total only) with a full, usable cart UI. Each item added must display name, thumbnail, quantity controls, per-line price, and remove/edit controls. The cart shows live subtotal and totals.
- **Acceptance Criteria:**
  - Cart header reads **Your Cart** and lists each added item as a row.
  - Each row includes: thumbnail image (small), dish name, quantity controls (+ / −), line item price, and a remove button.
  - Quantity changes update the line price and overall subtotal instantly.
  - A visible summary area shows: **Subtotal**, **Discount** (if applied), **GST (5%)**, **Delivery** (displayed as ₹0), and **Final Total**.
  - Cart is responsive and usable on mobile (stacked rows, touch-friendly controls).
  - All interactive controls are keyboard-accessible and have descriptive `aria-label`s.
- **Status:** ✅ Done

**Story: Implement Checkout Button Navigation**
- **Owner:** PO
- **Priority:** must
- **Description:** Make the checkout CTA navigate the user to a dedicated checkout/payment flow instead of being a placeholder.
- **Acceptance Criteria:**
  - Clicking the **Checkout** button routes the app to `/checkout` (client-side navigation).
  - The checkout page receives the current cart contents and displays the same summary information (items, subtotal, discounts, GST, delivery, total).
  - Back/Cancel from `/checkout` returns user to the menu/cart with state preserved.
  - Checkout CTA shows a loading/disabled state while navigation or simple pre-check runs.
- **Status:** ⏳ To Do

**Story: Checkout Page — Basic Payment Options**
- **Owner:** PO
- **Priority:** must
- **Description:** Implement a simple, first-pass checkout page with payment option selection and order placement placeholder. No payment gateway wiring yet — start with offline options.
- **Acceptance Criteria:**
  - `/checkout` shows: cart summary, delivery/table info form (name, phone, delivery notes or table number if dine-in), and a payment options block.
  - Payment options include at minimum: **Cash on Delivery (COD)** and **Pay at Counter**. Selecting an option marks it visually and stores the selection.
  - A primary **Place Order** button completes the flow and lands on an order confirmation placeholder page (`/order/confirmation`) that shows order id (fake), summary, and expected next steps.
  - The checkout page validates required fields (name, phone) and prevents placing an order if invalid.
  - Status indicators and accessible labels present for all options.
- **Status:** ⏳ To Do

**Story: Coupons Integration**
- **Owner:** PO
- **Priority:** should
- **Description:** Allow users to enter coupon codes on the cart/checkout page which apply discounts to the subtotal.
- **Acceptance Criteria:**
  - Cart has an **Apply Coupon** input with an **Apply** button.
  - When a coupon is entered, the app validates it against a local coupon list (CSV/JSON) or a simple in-memory list for v1.
  - Supported coupon types: `percent` (e.g., 10% off) and `flat` (e.g., ₹50 off).
  - If valid, the coupon amount appears as a **Discount** line in the summary and reduces the taxable base accordingly.
  - If invalid or expired, show a clear inline error message and do not alter totals.
  - Coupon application is idempotent (re-applying the same code does not stack).
  - Admin/marketing workflow for adding coupons is documented (CSV format example: `code,discountType,value`).
- **Status:** ⏳ Backlog

**Story: Tax & Delivery Calculation (GST 5% and Delivery ₹0)**
- **Owner:** PO
- **Priority:** must
- **Description:** Add tax and delivery lines to pricing logic. For v1, GST is fixed at 5% and delivery charge is ₹0; calculations must be transparent and shown line-by-line.
- **Acceptance Criteria:**
  - Pricing display shows: **Subtotal**, **Discount** (if any), **Taxable Amount** (subtotal − discount), **GST (5%)** (calculated on taxable amount), **Delivery** (₹0), and **Final Total**.
  - Formula used is explicit: `finalTotal = taxableAmount + GST + deliveryCharge`.
  - Example shown in UI for verification: e.g., Subtotal ₹400, Discount ₹40, Taxable ₹360, GST (5%) ₹18, Delivery ₹0, Total ₹378.
  - Values are rounded to the nearest rupee/paisa consistently and displayed with currency symbol `₹`.
  - Edge cases: negative totals prevented; discount cannot exceed subtotal.
- **Status:** ✅ Done

---

**Story: Orders API & Persistence (Plumbing)**
- **Owner:** Dev
- **Priority:** must
- **Description:** Implement server-side endpoints to create and manage orders and persist them to a simple JSON store with backups.
- **Acceptance Criteria:**
  - `POST /api/orders/create` creates an order record (id, items, totals, customer info, status=pending) and returns `{ orderId, paymentToken }`.
  - `GET /api/orders/:id` returns order details for polling.
  - `GET /api/orders` returns a paginated list for admin.
  - `POST /api/orders/:id/mark-paid` marks an order paid (admin/testing endpoint).
  - Orders persisted to `data/orders.json`; any write creates/updates `data/orders.json.bak`.
  - If the JSON file is missing, server falls back to in-memory storage and creates the file on first write.
  - No sensitive keys are stored in repo; all config via env.
- **Status:** ⏳ To Do

**Story: Razorpay Plumbing (Stubbed & Switchable)**
- **Owner:** Dev
- **Priority:** must
- **Description:** Add a ready-but-disabled Razorpay integration path. When enabled via env, server will create provider orders and verify signatures; when disabled, use stubbed payment flows.
- **Acceptance Criteria:**
  - `.env.sample` documents `RAZORPAY_ENABLED=false`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
  - `POST /api/webhook/razorpay` exists and verifies signatures when keys are present; when keys absent the endpoint is a no-op or returns 501.
  - Server uses `RAZORPAY_ENABLED` flag to decide real vs stubbed payment flows.
  - No hard-coded credentials in code.
- **Status:** ⏳ To Do

**Story: Checkout Frontend Wiring (Stubbed Payment Flow)**
- **Owner:** Dev
- **Priority:** must
- **Description:** Wire checkout UI to call `POST /api/orders/create`, show stubbed payment modal when Razorpay disabled, and poll `GET /api/orders/:id` for status updates.
- **Acceptance Criteria:**
  - Checkout calls `POST /api/orders/create` and receives `orderId`.
  - UI shows a stubbed payment modal (simulate success/failure) when `RAZORPAY_ENABLED=false`.
  - UI polls `GET /api/orders/:id` to update order status and proceeds to confirmation when marked `paid`.
  - When `RAZORPAY_ENABLED=true`, code path is ready to call Razorpay Checkout with returned payment token.
- **Status:** ⏳ To Do

**Story: Admin Dashboard — Orders (PWA)**
- **Owner:** Dev / PO
- **Priority:** must
- **Description:** Create an admin PWA route `/admin/orders` to list and manage incoming orders with minimal access control via `ADMIN_SECRET`.
- **Acceptance Criteria:**
  - `/admin/orders` lists orders newest first with status badges (pending, paid, preparing, completed).
  - Clicking an order opens details and allows status transitions (Accept → Preparing → Ready → Completed).
  - Dashboard supports simple polling every 3–5s to surface new orders; code prepared for WebSocket later.
  - Simple access gate: prompt for `ADMIN_SECRET` (env) before showing list; session persists during browser session.
  - Actions update `data/orders.json` and create `.bak` on write.
- **Status:** ⏳ To Do

**Story: Admin Notifications (Basic)**
- **Owner:** Dev
- **Priority:** should
- **Description:** Add a visual bell/indicator for new orders in admin dashboard and optional email notification capability (configurable).
- **Acceptance Criteria:**
  - Dashboard shows unread/new order indicator (count).
  - Server can be configured (env) to send an email on new order (template provided); email sending is optional and disabled by default.
  - Email config keys are documented in `.env.sample` and not committed.
- **Status:** ⏳ Backlog

**Story: Config & .env.sample**
- **Owner:** Dev
- **Priority:** must
- **Description:** Add `.env.sample` documenting `RAZORPAY_*`, `RAZORPAY_ENABLED`, `ADMIN_SECRET`, and other flags used by the new plumbing.
- **Acceptance Criteria:**
  - `.env.sample` present at repo root with placeholder values and brief comments.
  - Server reads env for behavior and does not fail if keys are missing (falls back to stubs).
- **Status:** ⏳ To Do

**Story: Data Backup & Safety**
- **Owner:** Dev
- **Priority:** must
- **Description:** Ensure writes to order data create a timestamped `.bak` and that no credentials are written to disk.
- **Acceptance Criteria:**
  - Any write to `data/orders.json` also writes `data/orders.json.bak` (timestamped or single latest `.bak`).
  - On server start, if `data/orders.json` is corrupted, server will try to recover from `.bak`.
  - No secrets or env values are persisted to data files.
- **Status:** ⏳ To Do

**Story: QA & Smoke Tests (Manual Checklist)**
- **Owner:** PO / QA
- **Priority:** must
- **Description:** Provide a short manual smoke-test checklist for PO to run locally to verify plumbing and admin flows (without Razorpay keys).
- **Acceptance Criteria:**
  - Checklist covers: create order via checkout (stubbed), admin sees order, admin marks paid, frontend polls and shows confirmation, backups created.
  - Checklist included in PR/notes for PO verification.
- **Status:** ⏳ To Do

---

### Epic: MVP Shipping Plan ⏳ In Dev

**Story: Domain & Routing (miyabhai.in)**
- **Owner:** PO
- **Priority:** must
- **Description:** Single domain rollout with routes: `/` (storefront), `/admin` (admin dashboard), `/staff` (staff panel). Ensure routing works on static host + serverless API.
- **Acceptance Criteria:**
  - Root `/` serves customer storefront (menu, cart, checkout) with mobile-first modern PWA UI.
  - `/admin` serves admin dashboard UI with desktop-friendly layout.
  - `/staff` serves staff/delivery panel UI with mobile-friendly layout.
  - Routes resolve on deployed domain and in local dev.
- **Status:** ⏳ To Do

**Story: Roles & Auth (MVP)**
- **Owner:** Dev / PO
- **Priority:** must
- **Description:** Implement lightweight auth and role model for Customer (guest + optional login), Admin (email/password), Staff (phone+OTP). Enforce RBAC server-side on APIs.
- **Acceptance Criteria:**
  - Orders API accepts either guest info (email+phone) or an authenticated user token.
  - Admin login endpoint (`/api/admin/login`) accepts email+password and issues a secure session cookie (or token) for admin routes.
  - Staff login endpoint supports phone+OTP (stubbed for MVP) returning a session/token.
  - Server-side checks role before allowing admin/staff actions.
  - Sessions persist for reasonable period and protected via secure cookie flags.
  - UI for login/signup flows matches app’s modern aesthetic.
- **Status:** ⏳ To Do

**Story: Customer Flow — Checkout & Orders**
- **Owner:** PO / Dev
- **Priority:** must
- **Description:** End-to-end customer flow: browse → add to cart → checkout → order created in DB with correct statuses and totals.
- **Acceptance Criteria:**
  - Checkout accepts name (optional), email (required), phone (required), and address/table (conditional).
  - On submit, server creates order in DB with `status=NEW` and `payment_status=pending` (or `paid` for COD toggle).
  - Confirmation page shows order number, amount, and brief next steps.
  - Totals include GST(5%) and delivery ₹0; coupon discount applied if any.
  - UI is consistent with Home/Menu design — modern, mobile-first.
- **Status:** ⏳ To Do

**Story: Payment Options (Razorpay + COD)**
- **Owner:** Dev
- **Priority:** must
- **Description:** Support Razorpay (prepaid) and Cash on Delivery. Razorpay flow is stubbed until keys provided.
- **Acceptance Criteria:**
  - Checkout shows both payment options and stores `payment_method` on order.
  - If Razorpay chosen and enabled, server creates provider order token and frontend triggers provider checkout.
  - If COD chosen, order remains `payment_status=pending` until admin marks cash collected.
  - Stubbed flow works when `RAZORPAY_ENABLED=false`.
  - Payment UI is simple, modern, and mobile-friendly.
- **Status:** ⏳ To Do

**Story: Admin Panel — Orders & Workflow**
- **Owner:** PO / Dev
- **Priority:** must
- **Description:** Admin dashboard with newest-first orders, order details, and status transitions: NEW → ACCEPTED → PREPARING → READY → COMPLETED.
- **Acceptance Criteria:**
  - Orders list shows status badges, payment method, customer contact, and quick action buttons.
  - Order detail view shows items, totals, payment info, and customer details.
  - Admin can cancel order with reason and mark COD as collected.
  - Dashboard supports polling or realtime updates for new orders.
  - Admin UI must be **desktop-first design**: clean tables, wide-screen layout, modern dashboard style.
- **Status:** ⏳ To Do

**Story: Admin Panel — Menu & Banner Management (MVP)**
- **Owner:** PO / Dev
- **Priority:** should
- **Description:** Minimal UI to add/edit menu items, change prices, toggle availability, and manage offer banners.
- **Acceptance Criteria:**
  - Admin can create/edit menu items (name, price, category, availability, image/public_id).
  - Admin can upload or reference banners/offers and mark them active/inactive.
  - Changes reflect in storefront after the next data refresh/build step.
  - UI consistent with admin panel — desktop-friendly.
- **Status:** ⏳ Backlog

**Story: Staff / Delivery Panel**
- **Owner:** PO / Dev
- **Priority:** must
- **Description:** Staff view that lists only assigned orders with actionable status updates for delivery staff.
- **Acceptance Criteria:**
  - Staff sees assigned orders only; each order view shows items, address, phone (tap-to-call).
  - Staff can update status: OUT_FOR_DELIVERY → COMPLETED and mark COD collected.
  - Minimal auth for staff (phone+OTP stubbed for MVP).
  - Staff UI must be **mobile-friendly**, optimized for fast usage by delivery staff on phones.
- **Status:** ⏳ To Do

**Story: Real-time & Notifications**
- **Owner:** Dev
- **Priority:** should
- **Description:** Surface new orders to admin instantly using Supabase Realtime or WebSocket; fallback to polling.
- **Acceptance Criteria:**
  - Admin dashboard receives new orders in near-real time (or via polling every 3–5s).
  - Visual bell/badge and optional sound indicate new orders.
  - Server can be configured to send optional email/SMS; disabled by default.
- **Status:** ⏳ Backlog

**Story: Database Essentials**
- **Owner:** Dev
- **Priority:** must
- **Description:** Finalize DB schema for core tables: orders, users, menu, banners/offers.
- **Acceptance Criteria:**
  - `orders` table includes: id, items(json), totals, status, payment_status, assigned_to, customer info, created_at.
  - `users` table includes: id, name, role, email, phone, passwordHash/otp fields.
  - `menu` table includes: id, name, price, category, availability, image/public_id.
  - `banners` table: id, image_url/public_id, title, active, startDate, endDate.
- **Status:** ⏳ To Do

**Story: Deploy & Host (Vercel + Supabase)**
- **Owner:** Dev / PO
- **Priority:** must
- **Description:** Deploy frontend and serverless API to Vercel; persist orders in Supabase. Ensure env variables are configured.
- **Acceptance Criteria:**
  - Project builds and deploys on Vercel.
  - Supabase `orders` table is used for order persistence.
  - `.env` keys are configured in Vercel and not committed to repo.
  - Deployed site accessible at test URL and mobile verified.
- **Status:** ⏳ To Do

**Story: Security & RBAC**
- **Owner:** Dev
- **Priority:** must
- **Description:** Enforce role-based access control server-side for admin/staff endpoints and protect admin UI.
- **Acceptance Criteria:**
  - Admin endpoints require admin session/token.
  - Staff endpoints require staff session/token and only return assigned orders.
  - Public endpoints for placing orders accept guest info safely and validate inputs.
- **Status:** ⏳ To Do

**Story: QA & Rollout Checklist**
- **Owner:** PO / QA
- **Priority:** must
- **Description:** Create a short rollout QA checklist covering customer checkout, admin flows, staff flows, payment toggles, and backups.
- **Acceptance Criteria:**
  - Checklist exists and is included in PR notes (or release notes).
  - PO can verify core flows on test URL before going live.
- **Status:** ⏳ To Do

context: 
### Epic: Admin Panel MVP Modules ⏳ To Do

**Story: Order Management System**
- **Owner:** PO / Dev
- **Priority:** must
- **Description:** Core system for processing and tracking orders, including listing, detail views, status changes, and basic actions.
- **Acceptance Criteria:**
  - Orders list displays newest-first with status badges and totals.
  - Dedicated order detail view with items, payment info, and customer details.
  - Status transitions supported: NEW → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → COMPLETED → CANCELED.
  - Pagination and filters (by status, date, search) functional on server-side.
  - Admin can update order status and assign to staff.
- **Status:** ⏳ To Do

**Story: Delivery Management**
- **Owner:** Dev
- **Priority:** must
- **Description:** System to manage delivery workflow, including assigning orders, tracking delivery status, and ensuring smooth handoff.
- **Acceptance Criteria:**
  - Orders can be assigned to staff/drivers dynamically (not hardcoded).
  - Delivery view shows which driver has which orders.
  - Delivery status flows update in real time or via polling.
  - Dispatch logic: available drivers shown in dropdown populated from DB.
  - No order can remain “Unassigned” without admin override.
- **Status:** ⏳ To Do

**Story: Driver Management**
- **Owner:** Dev
- **Priority:** must
- **Description:** CRUD for drivers/staff, with availability and profile management.
- **Acceptance Criteria:**
  - Drivers table in DB with fields: name, phone, status (active/inactive).
  - Admin panel page to view, add, edit, or deactivate drivers.
  - Orders can only be assigned to drivers marked as active.
  - Driver availability status visible in assignment dropdown.
  - Basic driver profile view with contact and recent assignments.
- **Status:** ⏳ To Do

**Story: Basic Analytics Dashboard**
- **Owner:** PO / Dev
- **Priority:** must
- **Description:** Provide KPIs for operational oversight, based on real server-side data.
- **Acceptance Criteria:**
  - KPI cards: Total Revenue, Total Orders, Pending Orders, Completed Orders, New Customers.
  - Metrics calculated on the server (not client reduce()).
  - Support date-range filter (today, 7 days, 30 days).
  - Data visualizations: line chart (orders over time), pie chart (payment methods).
  - Responsive design: desktop-first with clear visual hierarchy.
- **Status:** ⏳ To Do

**Story: Customer Management**
- **Owner:** Dev
- **Priority:** should
- **Description:** Manage customer profiles, order history, and contact data.
- **Acceptance Criteria:**
  - Customers table in DB with unique ID, contact info, and join date.
  - Admin panel page to view list of all customers.
  - Individual customer profile shows contact details and past orders.
  - Orders table links to customer profile for quick navigation.
  - Basic search/filter by customer name, email, or phone.
- **Status:** ⏳ To Do

**Story: Financial Reporting**
- **Owner:** PO / Dev
- **Priority:** should
- **Description:** Generate basic reports for revenue and payments to support operations.
- **Acceptance Criteria:**
  - Financial reports: daily/weekly/monthly revenue summaries.
  - Reports exportable as CSV or PDF (stub MVP with CSV).
  - Breakdowns: prepaid vs COD revenue.
  - Include GST and discount calculations in reports.
  - Accessed via dedicated “Reports” section in admin panel.
- **Status:** ⏳ To Do


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

### Epic: Asset Hygiene ⏳

**Story: Optimize and Standardize Image Assets**
- **Description:** Image assets are not optimized, leading to poor performance. They also have inconsistent naming and formats.
- **Acceptance Criteria:**
    - All images in the `assets` directory are compressed and optimized for the web.
    - Images are converted to modern formats like WebP where appropriate.
    - A consistent naming convention is applied to all image files.
- **Status:** ✅ Done

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
