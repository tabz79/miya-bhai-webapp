
## 2025-09-18
- Story: Visual Feature — Floating Category Pill + Category Picker Modal (Menu — Category Quick-Jump)
- Audit Findings:
  - Requirement Recap: Add a small pill-shaped floating **Category** button on the `/menu` page. Tapping the pill opens a compact modal/popover listing all menu categories. Selecting a category closes the picker and smoothly scrolls the page to that category heading. The floating pill must use brand accent colors and follow brand focus/hover styles.
    Acceptance Criteria include:
    1. A floating pill (40–48px high, rounded) appears on `/menu` in the lower-right area above `BottomNav`, visually unobtrusive and not overlapping essential controls.
    2. Pill uses brand accent: `bg-[#3c3c3b]` (or `bg-colorbackgroundbestseller`) with `focus:ring-[#ae905c]` and `shadow-sm`.
    3. Tapping the pill opens a compact modal/popover anchored above the pill with a list of all categories in `groupedMenu` order. The modal width is constrained (max-w-xs), scrollable if categories overflow.
    4. Each category item in the modal is a single-line button with truncation, role="menuitem", and keyboard navigation (Up/Down, Enter to select, Esc to close).
    5. Selecting a category closes the modal and **smoothly scrolls** the page to that category’s heading (`.menu-category-heading` with `data-category`). Use native `Element.scrollIntoView({ behavior: 'smooth', block: 'start' })` and ensure the heading ends up visible below the sticky toolbar (respect `--toolbar-height`).
    6. Works on mobile and desktop; pill is reachable above `BottomNav` (i.e., stays visible). On very small screens ensure it does not block important CTA buttons.
    7. Accessible: modal has `role="dialog"`, `aria-modal="true"`, focus trap while open, and returns focus to the pill when closed. Category changes should be announced via `aria-live` on the existing `StickyCategory` (no duplicate announcements).
    8. No visual regressions to existing layout, `StickyCategory`, or `BottomNav`. Z-index and pointer-events handled so underlying interactions are not blocked.
    9. Performance: opening/closing and scroll must be instant and not cause layout jank.
  - Tester Observation: The floating menu button is at the extreme bottom right corner of the desktop screen, off the frame, making it useless. Clicking the floating button does nothing; it does not open the category picker modal.
  - Dev Implementation Summary: Created `CategoryPicker.tsx` and `CategoryJumpPill.tsx`. Integrated `CategoryJumpPill` into `Menu.tsx`. Implemented `handleSelectCategory` for smooth scrolling and updated category `h2` elements for scroll targeting.
  - Root Cause: The floating category pill is incorrectly positioned, appearing off-screen on desktop, indicating a CSS positioning issue (e.g., `position`, `bottom`, `right`, `z-index`) that doesn't correctly account for the mobile frame within a desktop wrapper. Additionally, the click functionality to open the `CategoryPicker` modal is not working, suggesting a problem with event handling, state management for modal visibility, or the modal being rendered but hidden due to incorrect z-index or conditional rendering logic.
  - Evidence:
    - `client/src/components/Menu/CategoryJumpPill.tsx`: Likely contains incorrect positioning CSS or a faulty click handler.
    - `client/src/components/Menu/CategoryPicker.tsx`: The modal component that is not being displayed.
    - `client/src/pages/Menu.tsx`: The integration point where the components are used, potentially where modal state is managed or components are incorrectly rendered.
- Suggestions for Fix:
  - Review `client/src/components/Menu/CategoryJumpPill.tsx` to correct its CSS positioning. Ensure it is `position: fixed` relative to the intended mobile viewport and correctly placed above `BottomNav` on both mobile and desktop, without going off-screen.
  - Debug the click handler in `client/src/components/Menu/CategoryJumpPill.tsx` and the state management in `client/src/pages/Menu.tsx` that controls the visibility of `CategoryPicker.tsx`. Verify that the modal's state is correctly toggled and that the `CategoryPicker` component is rendered with an appropriate `z-index` to be visible.
  - Once the modal opens, verify that it correctly lists categories and that selecting a category triggers the `handleSelectCategory` function and smooth scrolling as per acceptance criteria.
- Status: Audit Complete