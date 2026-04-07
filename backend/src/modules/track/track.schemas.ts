import { z } from "zod";

const optionalYearSchema = z
  .union([z.literal("all"), z.coerce.number().int().positive()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "all") return "all";
    return Number(value);
  });

export const trackHistoryQuerySchema = z.object({
  trackName: z.string().trim().min(1),
  year: optionalYearSchema,
  playerName: z.string().trim().min(1).optional(),
  carName: z.string().trim().min(1).optional()
});
