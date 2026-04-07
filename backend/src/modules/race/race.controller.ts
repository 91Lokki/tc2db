import type { Request, Response } from "express";
import { sendOk } from "../../shared/http/api-response";
import {
  createSeasonSchedule,
  getNextGlobalRace,
  getNextScheduleForYear,
  getSeasonSchedule,
  simulateNextRaceForSeason
} from "./race.service";

export async function getNextGlobalRaceController(_req: Request, res: Response) {
  return sendOk(res, await getNextGlobalRace());
}

export async function getNextScheduleController(req: Request, res: Response) {
  return sendOk(res, await getNextScheduleForYear(Number(req.params.year)));
}

export async function getSeasonScheduleController(req: Request, res: Response) {
  return sendOk(res, await getSeasonSchedule(Number(req.params.year)));
}

export async function simulateNextRaceController(req: Request, res: Response) {
  return sendOk(res, await simulateNextRaceForSeason(req.body.seasonYear));
}

export async function createSeasonController(req: Request, res: Response) {
  return sendOk(res, await createSeasonSchedule(req.body.seasonYear));
}
