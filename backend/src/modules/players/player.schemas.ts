import { z } from "zod";

export const profileParamsSchema = z.object({
  username: z.string().trim().min(1)
});

export const profileQuerySchema = z.object({
  includePrivate: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (typeof value === "boolean") return value;
      return value === "true";
    })
});
