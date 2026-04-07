import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores");

const passwordSchema = z.string().min(6).max(64);

export const registerBodySchema = z.object({
  username: usernameSchema,
  password: passwordSchema
});

export const loginBodySchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export const changePasswordBodySchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: passwordSchema
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must differ from old password",
    path: ["newPassword"]
  });

export const playerIdParamSchema = z.object({
  playerId: z.coerce.number().int().positive()
});
