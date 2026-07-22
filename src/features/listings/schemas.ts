import { z } from 'zod';

export const createListingSchema = z.object({
  type: z.enum(['mystery_box', 'fixed_item']),
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  boxSize: z.enum(['small', 'medium', 'large', 'xl']).optional(),
  originalPrice: z.number().min(1, 'Original price must be greater than 0'),
  salePrice: z.number().min(1, 'Sale price must be greater than 0'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  pickupWindowStart: z.string().min(1, 'Start time is required'),
  pickupWindowEnd: z.string().min(1, 'End time is required'),
  dietaryTags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
}).refine((data) => data.salePrice < data.originalPrice, {
  message: 'Sale price must be less than original price',
  path: ['salePrice'],
}).refine((data) => new Date(data.pickupWindowEnd) > new Date(data.pickupWindowStart), {
  message: 'End time must be after start time',
  path: ['pickupWindowEnd'],
});

export type CreateListingForm = z.infer<typeof createListingSchema>;
