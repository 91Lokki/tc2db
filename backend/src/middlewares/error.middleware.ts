import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/app-error";

type PrismaLikeError = {
  code?: string;
  message: string;
  meta?: unknown;
};

function isPrismaLikeError(error: unknown): error is PrismaLikeError {
  return typeof error === "object" && error !== null && "message" in error;
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.flatten()
    });
  }

  if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
    return res.status(401).json({
      message: error.message,
      code: "INVALID_TOKEN"
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details
    });
  }

  if (isPrismaLikeError(error) && error.code === "P2002") {
    return res.status(409).json({
      message: "Unique constraint violation",
      code: "CONFLICT",
      details: error.meta
    });
  }

  if (isPrismaLikeError(error) && error.code === "P2025") {
    return res.status(404).json({
      message: "Record not found",
      code: "NOT_FOUND"
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR"
  });
}
