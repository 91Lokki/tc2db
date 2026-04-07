import { z } from "zod";

const numericYearSchema = z.coerce.number().int().positive();

export const standingsParamsSchema = z.object({
  year: z.union([z.literal("all"), numericYearSchema]).transform((value) =>
    value === "all" ? value : Number(value)
  )
});

export const standingsQuerySchema = z.object({
  playerName: z.string().trim().min(1).optional()
});
