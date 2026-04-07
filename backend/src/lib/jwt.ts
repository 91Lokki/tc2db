import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser } from "../shared/types/auth.types";

export function signAuthToken(payload: AuthUser): string {
  return jwt.sign(
    {
      username: payload.username,
      isAdmin: payload.isAdmin
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      subject: String(payload.playerId)
    }
  );
}

export function verifyAuthToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

  const playerId = Number(decoded.sub);
  if (
    !Number.isInteger(playerId) ||
    playerId <= 0 ||
    typeof decoded.username !== "string" ||
    typeof decoded.isAdmin !== "boolean"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    playerId,
    username: decoded.username,
    isAdmin: decoded.isAdmin
  };
}
