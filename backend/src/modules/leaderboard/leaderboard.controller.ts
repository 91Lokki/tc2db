import type { Request, Response } from "express";
import { sendOk } from "../../shared/http/api-response";
import { getLeaderboardStandings } from "./leaderboard.service";

export async function getLeaderboardStandingsController(req: Request, res: Response) {
  const result = await getLeaderboardStandings(
    req.params.year === "all" ? "all" : Number(req.params.year),
    typeof req.query.playerName === "string" ? req.query.playerName : undefined
  );

  return sendOk(res, result);
}
