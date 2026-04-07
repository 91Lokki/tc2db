import type { Request, Response } from "express";
import { sendOk } from "../shared/http/api-response";

export function notFoundMiddleware(req: Request, res: Response) {
  return sendOk(
    res,
    {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    },
    404
  );
}
