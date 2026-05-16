import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, CartItem, Box } from "@/types";
import { getTierTotal } from "@/lib/utils";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  bump: number; // increments on every addItem to signal the cart icon
  mobileMenuOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number, box?: Box) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemBox: (productId: string, box: Box | undefined) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      bump: 0,
      mobileMenuOpen: false,

      addItem: (product: Product, quantity: number = 1, box?: Box) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );

          if (existingItem) {
            const newQty = Math.min(existingItem.quantity + quantity, product.stock);
            if (newQty === existingItem.quantity) return state; // already at stock limit
            return {
              bump: state.bump + 1,
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: newQty }
                  : item
              ),
            };
          }

          return {
            bump: state.bump + 1,
            items: [...state.items, { product, quantity, selectedBox: box }],
          };
        });
      },

      setItemBox: (productId: string, box: Box | undefined) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, selectedBox: box } : item
          ),
        }));
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.min(quantity, item.product.stock) }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      },

      closeMobileMenu: () => {
        set({ mobileMenuOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const productTotal = getTierTotal(item.product.priceTiers, item.product.price, item.quantity);
          const boxTotal = (item.selectedBox?.price ?? 0) * item.quantity;
          return total + productTotal + boxTotal;
        }, 0);
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find((item) => item.product.id === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: "skmei-cart",
      skipHydration: true,
    }
  )
);
