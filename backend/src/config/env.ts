import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/tc2db?schema=public"),
  JWT_SECRET: z.string().min(16).default("development-secret-change-me"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  CORS_ORIGIN: z.string().min(1).default("*")
});

export const env = envSchema.parse(process.env);
