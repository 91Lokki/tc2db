import type { Response } from "express";

export function sendOk<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json(data);
}

export function sendCreated<T>(res: Response, data: T) {
  return res.status(201).json(data);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
