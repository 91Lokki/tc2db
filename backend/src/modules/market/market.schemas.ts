import { z } from "zod";

export const dealerCarsQuerySchema = z.object({
  brand: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  minYear: z.coerce.number().int().positive().optional(),
  maxYear: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional()
});

export const usedCarsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  minYear: z.coerce.number().int().positive().optional(),
  maxYear: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional()
});

export const buyDealerCarBodySchema = z.object({
  buyerId: z.coerce.number().int().positive(),
  modelId: z.coerce.number().int().positive()
});

export const sellCarBodySchema = z.object({
  sellerId: z.coerce.number().int().positive(),
  carId: z.coerce.number().int().positive(),
  price: z.coerce.number().int().positive()
});

export const cancelSellBodySchema = z.object({
  sellerId: z.coerce.number().int().positive(),
  carId: z.coerce.number().int().positive()
});

export const purchaseUsedCarBodySchema = z.object({
  buyerId: z.coerce.number().int().positive(),
  carId: z.coerce.number().int().positive()
});
