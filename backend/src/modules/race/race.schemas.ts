import { z } from "zod";

export const seasonYearParamSchema = z.object({
  year: z.coerce.number().int().positive()
});

export const simulateRaceBodySchema = z
  .object({
    SeasonYear: z.coerce.number().int().positive().optional(),
    seasonYear: z.coerce.number().int().positive().optional()
  })
  .refine((data) => data.SeasonYear !== undefined || data.seasonYear !== undefined, {
    message: "seasonYear is required"
  })
  .transform((data) => ({
    seasonYear: data.seasonYear ?? data.SeasonYear!
  }));

export const createSeasonBodySchema = z
  .object({
    SeasonYear: z.coerce.number().int().positive().optional(),
    seasonYear: z.coerce.number().int().positive().optional()
  })
  .refine((data) => data.SeasonYear !== undefined || data.seasonYear !== undefined, {
    message: "seasonYear is required"
  })
  .transform((data) => ({
    seasonYear: data.seasonYear ?? data.SeasonYear!
  }));
