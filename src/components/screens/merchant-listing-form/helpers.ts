import type { CreateListingForm } from '@/src/features/listings/schemas';
import type { Listing } from '@/src/types';

export function parseArrayParam(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value ? value.split(',').filter(Boolean) : [];
  }
}

export function buildListingPayload(
  data: CreateListingForm,
  images: string[],
  merchantId: string,
  status: Listing['status']
): Omit<Listing, 'id' | 'createdAt'> {
  const base = {
    merchantId,
    type: data.type,
    title: data.title,
    description: data.description,
    images:
      images.length > 0
        ? images
        : [`https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent(data.title)}`],
    category: data.category,
    originalPrice: data.originalPrice,
    salePrice: data.salePrice,
    quantity: data.quantity,
    quantityRemaining: data.quantity,
    pickupWindowStart: data.pickupWindowStart.toISOString(),
    pickupWindowEnd: data.pickupWindowEnd.toISOString(),
    dietaryTags: data.dietaryTags,
    allergens: data.allergens,
    status,
    lowStockThreshold: data.lowStockThreshold,
  } as Omit<Listing, 'id' | 'createdAt'>;

  if (data.type === 'mystery_box') {
    return {
      ...base,
      boxSize: data.boxSize ?? 'medium',
      estimatedRetailValue: data.originalPrice,
    } as Omit<Listing, 'id' | 'createdAt'>;
  }

  return base;
}
