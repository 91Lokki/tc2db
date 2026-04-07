import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyAuthToken } from "../lib/jwt";
import { AppError } from "../shared/errors/app-error";

async function authenticateRequest(req: Request) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid authorization header", "AUTH_REQUIRED");
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAuthToken(token);

  const player = await prisma.player.findUnique({
    where: { id: payload.playerId },
    select: {
      id: true,
      username: true,
      isAdmin: true,
      accountStatus: true,
      deletedAt: true
    }
  });

  if (!player || player.accountStatus !== "ACTIVE" || player.deletedAt) {
    throw new AppError(401, "Account is not active", "ACCOUNT_INACTIVE");
  }

  req.user = {
    playerId: player.id,
    username: player.username,
    isAdmin: player.isAdmin
  };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    await authenticateRequest(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("Authorization");
    if (!header) {
      next();
      return;
    }

    await authenticateRequest(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    await authenticateRequest(req);

    if (!req.user?.isAdmin) {
      throw new AppError(403, "Admin access required", "ADMIN_REQUIRED");
    }

    next();
  } catch (error) {
    next(error);
  }
}
