
# Miya Bhai Web App - Code Audit Report (v1)

**Date:** 2025-09-04

This report details the findings of a code audit performed on the Miya Bhai Web App source code. The audit compares the implemented code against the requirements specified in `prd.md` and `design_specs.md`.

---

## 1. Missing Components

The following components are defined in the PRD and design specs but have not been implemented:

- **`CategoryDropdown`**: While a component file exists, the dropdown functionality itself is not fully implemented in the `MenuHeader`. The `DropdownToggleButton` is present, but the dropdown menu does not appear on click.
- **`OfferCarousel`**: The `OfferCarousel` component is present, but it is not used on the Menu page as specified in the PRD.
- **`ScrollControlButtons`**: The `BestSellersStrip` is implemented with a horizontal scroll, but the circular navigation buttons (`ScrollControlButtons`) are not visible or functional.
- **`GridNavigationButtons`**: The `MenuGrid` is implemented, but the circular navigation buttons for paging through menu items are not visible or functional.

---

## 2. Incorrect Component Implementation

Several components are present but deviate from the design specifications:

- **`SearchBarPill`**:
    - **Behavior**: The component does not expand on focus or collapse on blur as required. It maintains a fixed width.
    - **Dimensions**: The dimensions (180x36px) are hardcoded, but the component does not dynamically resize.
- **`HeroCarousel`**:
    - **Auto-scroll**: The auto-scroll functionality is implemented, but it does not pause on hover.
    - **Indicators**: The active indicator style does not match the "modern dots/pill" design. The implementation uses simple black dots for both active and inactive states.
- **`BestSellersStrip`**:
    - **Dimensions**: The cards within the strip do not consistently adhere to the 60x100px dimensions.
    - **Radius**: The `BestSellerCard` does not have the specified `95px` border-radius, resulting in a less rounded shape.
- **`MenuCard`**:
    - **Dimensions**: The card dimensions (80x110px) and image dimensions (80x82px) are not consistently applied.
    - **`AddToCartButton`**: The `AddToCartButton` is a simple image link and not a functional button component. It also uses a hardcoded asset path instead of importing the icon.
- **`BottomNav`**:
    - **Cart Badge**: The cart badge is present but not functional. It is hardcoded to "0" and does not update when items are added to the cart.

---

## 3. Token and Theming Issues

- **Color Mismatches**:
    - The background color of the `BestSellersStrip` (`#4E4739`) is not being applied from the `tokens.json` file. Instead, a CSS class `bg-colorbackgroundbestseller` is used, which is defined in `index.css`.
    - Several other colors are defined in `index.css` as CSS variables, but they are not consistently used throughout the components. Many components use hardcoded Tailwind CSS color classes instead of the defined tokens.
- **Typography**:
    - The custom fonts specified in `design_specs.md` (e.g., "Aref Ruqaa Ink", "Carattere") are not loaded or applied correctly. The typography classes in `index.css` are not being utilized in the components.
- **Shadows**:
    - The `SearchBoxShadow` and `CardShadow` effects are defined in `tokens.json` but are applied via CSS classes in `index.css` instead of being used as Tailwind utility classes.

---

## 4. Asset Usage Issues

- **Incorrect File Names**:
    - The `DeliveryAd` component imports `DeliveryGuy.png.png` and `delivery-icon.png.png`, which have double extensions. The design specs refer to `delivery-guy.png` and `delivery-icon.png`.
    - The `MenuCard` uses a hardcoded path to `/figmaAssets/add-to-cart-button.svg` instead of importing the asset.
- **Missing Imports**:
    - Several components in the `pages/sections` directory use hardcoded paths to assets in the `public/figmaAssets` directory instead of importing them from the `src/assets` directory. This will cause issues with the build process.
- **Legacy Assets**:
    - The `client/public/figmaAssets` directory contains numerous SVG files for the "add-to-cart-button", which appear to be legacy assets. The `AddToCartButton` component should be used instead.

---

## 5. AI Discoverability (SEO)

- **`sitemap.xml` and `robots.txt`**: These files are present in the `client/public` directory, which is a good start. However, the `sitemap.xml` is static and will not be updated automatically as new pages or menu items are added.
- **Schema.org JSON-LD**:
    - The `JsonLD` component is a good implementation of `Restaurant` and `Menu` schemas.
    - However, the `image` URL in the `Restaurant` schema is hardcoded to `/src/assets/HeroImage.png`, which is incorrect. It should be a publicly accessible URL.
    - The `Offer` schema is not implemented for the `OfferCarousel`.
- **Meta Tags**:
    - The `MetaTags` component is well-implemented and covers the basic requirements.
    - The `image` URL in the `MetaTags` component is also hardcoded to `/src/assets/HeroImage.png`.
- **FAQ Page**:
    - A dedicated FAQ page exists, which is good.
    - A summary section for AI assistants is present, which is a great feature.

---

## 6. Code Hygiene

- **Inline CSS**:
    - The `BestSellerCard` and `HeroSlide` components contain inline styles for positioning and font properties. These should be extracted to CSS classes.
- **Duplicated Styles**:
    - There is significant code duplication in the `pages/sections` directory. The `BestSellersSection`, `DeliveryAdSection`, `HeroSection`, and `MenuSection` components are almost identical to the components in the `components` directory. This should be refactored to use the components from the `components` directory.
- **Legacy Leftovers**:
    - The `HomeScreen.tsx` file appears to be a legacy file that is not used in the application. It should be removed.
    - The `figmaCSS.txt` file is a good reference, but the styles should be migrated to Tailwind CSS classes and tokens.
- **Hardcoded Values**:
    - Many components contain hardcoded values for dimensions, colors, and text. These should be replaced with values from the `tokens.json` file and `mockData.ts`.

---

## Summary and Recommendations

The project has a solid foundation, with a good component structure and a clear understanding of the requirements. However, there are several areas that need improvement to align with the PRD and design specs.

**Key recommendations:**

1.  **Implement Missing Components**: Prioritize the implementation of the missing components, such as `CategoryDropdown`, `OfferCarousel`, and the navigation buttons.
2.  **Correct Component Implementation**: Address the discrepancies in the existing components to match the design specifications.
3.  **Refactor CSS and Theming**: Refactor the CSS to use the defined tokens and utility classes consistently. Remove the duplicated CSS variables in `index.css`.
4.  **Fix Asset Usage**: Correct the asset file names and paths, and remove any legacy assets.
5.  **Improve AI Discoverability**: Fix the hardcoded image URLs in the `JsonLD` and `MetaTags` components.
6.  **Improve Code Hygiene**: Refactor the code to remove duplication, inline styles, and hardcoded values.

By addressing these issues, the Miya Bhai Web App will be in a much better state, more maintainable, and more aligned with the project's goals.
