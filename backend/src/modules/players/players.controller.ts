import type { Request, Response } from "express";
import { sendOk } from "../../shared/http/api-response";
import { buildPlayerProfile, getGarageForPlayer } from "./players.service";

export async function getProfileController(req: Request, res: Response) {
  const result = await buildPlayerProfile({
    username: req.params.username,
    includePrivate: Boolean(req.query.includePrivate),
    requesterPlayerId: req.user?.playerId
  });

  return sendOk(res, result);
}

export async function getGarageController(req: Request, res: Response) {
  const result = await getGarageForPlayer(req.user!.playerId);
  return sendOk(res, result);
}
