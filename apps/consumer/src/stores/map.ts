import { create } from 'zustand';
import type { Bounds, ListingFilters } from '@maithing/shared';

interface MapState {
  bounds: Bounds | null;
  filters: ListingFilters;
  selectedListingId: string | null;
  setBounds: (bounds: Bounds) => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  setSelectedListing: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  bounds: null,
  filters: {},
  selectedListingId: null,
  setBounds: (bounds) => set({ bounds }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setSelectedListing: (selectedListingId) => set({ selectedListingId }),
}));
