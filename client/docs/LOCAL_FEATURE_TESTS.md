# Manual Feature Tests

## Important: Clear Vite Cache

Before running the app, it's recommended to clear the Vite cache to ensure all changes are applied correctly.

1.  **Action:** Delete the `node_modules/.vite` directory in the `client` folder.

---

## Search Functionality

1.  **Action:** Go to the Home or Menu page and type "Biryani" into the search bar.
    **Expected Result:** You should be navigated to the `/menu` page, and only dishes with "Biryani" in their name should be visible.

---

## Bestseller Card Navigation

1.  **Action:** On the Home page, click on the "Chicken Biryani" bestseller card.
    **Expected Result:** You should be navigated to the `/menu` page, and the page should scroll down to the "Chicken Biryani" dish. The dish should be highlighted or otherwise brought into focus.

---

## Add to Cart & Cart Page

1.  **Action:** On the Menu page, click the "ADD" button for a few different dishes.
    **Expected Result:** The small cart badge in the bottom navigation should increment.
    **Console Check:** Open the browser console and verify that "Adding item:" logs appear with the correct item data.

2.  **Action:** Navigate to the Cart page.
    **Expected Result:** The dishes you added should be listed in the cart with their quantities and prices. The total price should be calculated correctly.
    **Console Check:** Open the browser console and verify that "Cart rehydrating" and "Cart has been rehydrated" logs appear, indicating that the cart state is being loaded from `localStorage`.

3.  **Action:** Refresh the page.
    **Expected Result:** The items in your cart should persist.

---

## Offers Banner

1.  **Action:** Go to the Menu page.
    **Expected Result:** You should see an auto-rotating banner of offers at the top of the page. The offers should change every 3-5 seconds.

---

## Profile Page

1.  **Action:** Navigate to the Profile page.
    **Expected Result:** You should see a user profile with the name "Miya Bhai" and the email "hello@example.com".

2.  **Action:** Click the "Sign Out" button.
    **Expected Result:** An alert should appear confirming that you have been signed out and your cart has been cleared. If you navigate to the cart page, it should be empty.
    **Console Check:** Open the browser console and verify that "Clearing cart" log appears.

---

## Home Category Dropdown

1.  **Action:** On the Home page, click on the category pill next to the "Menu" title.
    **Expected Result:** The category dropdown should open and be fully visible, not overflowing under the bottom navigation bar. You should be able to scroll through all categories if there are many.

---

## Menu Floating Categories Button & Picker

1.  **Action:** On the Menu page, scroll down the page.
    **Expected Result:** A floating button with a menu icon should appear at the bottom right of the screen.

2.  **Action:** Click the floating menu button.
    **Expected Result:** A compact popup card with a list of categories should appear above the bottom navigation. It should have a constrained width and height with internal vertical scrolling if the list is long. It should close on outside click and when the Escape key is pressed.
