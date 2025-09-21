
type MenuItem = any;

export const PLACEHOLDER_IMAGE_PATH = "/src/assets/placeholder-menu-item.png";

export const sortMenuItems = (items: MenuItem[]): MenuItem[] => {
  const itemsWithRealImages = items.filter(
    (item) => item.resolvedImage && !item.resolvedImage.includes(PLACEHOLDER_IMAGE_PATH)
  );
  const itemsWithPlaceholderImages = items.filter(
    (item) => !item.resolvedImage || item.resolvedImage.includes(PLACEHOLDER_IMAGE_PATH)
  );

  return [...itemsWithRealImages, ...itemsWithPlaceholderImages];
};
