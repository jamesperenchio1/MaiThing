import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvZustandStorage } from '@/src/lib/mmkvStorage';
import type { Listing } from '@/src/types';

interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (listing: Listing, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (listing, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.listing.id === listing.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.listing.id === listing.id
                ? { ...i, quantity: Math.min(i.quantity + quantity, listing.quantityRemaining) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { listing, quantity }] });
        }
      },
      removeItem: (listingId) =>
        set({ items: get().items.filter((i) => i.listing.id !== listingId) }),
      updateQuantity: (listingId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(listingId);
          return;
        }
        set({
          items: get().items.map((i) => (i.listing.id === listingId ? { ...i, quantity } : i)),
        });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.listing.salePrice * i.quantity, 0),
    }),
    {
      name: 'maithing-cart',
      storage: createJSONStorage(() => mmkvZustandStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Prune listings whose pickup window has already closed
        const now = Date.now();
        state.items = state.items.filter(
          (item) => new Date(item.listing.pickupWindowEnd).getTime() > now
        );
      },
    }
  )
);
