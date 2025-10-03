import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
}

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  addToCart: (item: Omit<CartItem, 'quantity' | 'image'> & { image?: string }) => void;
  removeFromCart: (id: string) => void;
  decreaseQuantity: (id: string) => void; // New function
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  coupon: null,
  addToCart: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      } else {
        return {
          items: [...state.items, { ...product, quantity: 1, image: product.image || '' }],
        };
      }
    }),
  removeFromCart: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  decreaseQuantity: (id) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === id);
      if (existingItem && existingItem.quantity > 1) {
        return {
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity - 1 } : item
          ),
        };
      } else {
        return {
          items: state.items.filter((item) => item.id !== id),
        };
      }
    }),
  clearCart: () => set({ items: [], coupon: null }),
  applyCoupon: (coupon) => set({ coupon }),
  removeCoupon: () => set({ coupon: null }),
}));
