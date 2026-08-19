import type { Listing, ListingStatus } from '@/src/types';

export type PendingAction =
  | {
      type: 'status';
      id: string;
      title: string;
      nextStatus: ListingStatus;
      data: Partial<Listing>;
    }
  | { type: 'delete'; id: string; title: string };
