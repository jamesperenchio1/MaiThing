import { create } from 'zustand';
import type { Tables } from '@maithing/shared';

type PickupSlot = Tables<'pickup_slots'>;

interface PickedItem {
  itemId: string;
  qty: number;
}

interface ListingStore {
  selectedSlot: PickupSlot | null;
  pickedItems: PickedItem[];
  setSelectedSlot: (slot: PickupSlot | null) => void;
  setPickedItems: (items: PickedItem[]) => void;
  reset: () => void;
}

export const useListingStore = create<ListingStore>()((set) => ({
  selectedSlot: null,
  pickedItems: [],
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setPickedItems: (items) => set({ pickedItems: items }),
  reset: () => set({ selectedSlot: null, pickedItems: [] }),
}));
