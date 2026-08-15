import i18n from 'i18next';
import { z } from 'zod';

export const createListingSchema = z
  .object({
    type: z.enum(['mystery_box', 'fixed_item']),
    title: z.string().min(2),
    description: z.string().min(10),
    category: z.string().min(1),
    boxSize: z.enum(['small', 'medium', 'large', 'xl']).optional(),
    originalPrice: z.number().min(1),
    salePrice: z.number().min(1),
    quantity: z.number().min(1),
    lowStockThreshold: z.coerce.number().int().min(1).max(100).optional().default(3),
    pickupWindowStart: z.date({
      errorMap: () => ({ message: i18n.t('validation.listing.pickupWindowRequired') }),
    }),
    pickupWindowEnd: z.date({
      errorMap: () => ({ message: i18n.t('validation.listing.pickupWindowRequired') }),
    }),
    dietaryTags: z.array(z.string()).default([]),
    allergens: z.array(z.string()).default([]),
  })
  .refine(
    (data) => data.salePrice < data.originalPrice,
    () => ({
      message: i18n.t('validation.listing.salePriceLessThanOriginal'),
      path: ['salePrice'],
    })
  )
  .refine(
    (data) => data.pickupWindowEnd > data.pickupWindowStart,
    () => ({
      message: i18n.t('validation.listing.pickupWindowOrder'),
      path: ['pickupWindowEnd'],
    })
  )
  .refine(
    (data) => data.salePrice <= data.originalPrice * 0.7,
    () => ({
      message: i18n.t('validation.listing.discountMinimum'),
      path: ['salePrice'],
    })
  );

export type CreateListingForm = z.infer<typeof createListingSchema>;
