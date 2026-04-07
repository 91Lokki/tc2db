import type { Request, Response } from "express";
import { sendOk } from "../../shared/http/api-response";
import { getTrackHistory, getTrackOptions, getTrackYears } from "./track.service";

export async function getTrackYearsController(_req: Request, res: Response) {
  return sendOk(res, await getTrackYears());
}

export async function getTrackOptionsController(_req: Request, res: Response) {
  return sendOk(res, await getTrackOptions());
}

export async function getTrackHistoryController(req: Request, res: Response) {
  return sendOk(
    res,
    await getTrackHistory({
      trackName: String(req.query.trackName),
      year: req.query.year === "all" || req.query.year === undefined ? "all" : Number(req.query.year),
      playerName: typeof req.query.playerName === "string" ? req.query.playerName : undefined,
      carName: typeof req.query.carName === "string" ? req.query.carName : undefined
    })
  );
}
