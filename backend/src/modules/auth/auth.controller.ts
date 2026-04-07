import type { Request, Response } from "express";
import { sendCreated, sendOk } from "../../shared/http/api-response";
import { changePlayerPassword, loginPlayer, registerPlayer, softDeletePlayer } from "./auth.service";

export async function registerController(req: Request, res: Response) {
  const result = await registerPlayer(req.body);
  return sendCreated(res, result);
}

export async function loginController(req: Request, res: Response) {
  const result = await loginPlayer(req.body);
  return sendOk(res, result);
}

export async function changePasswordController(req: Request, res: Response) {
  const result = await changePlayerPassword({
    targetPlayerId: Number(req.params.playerId),
    requesterPlayerId: req.user!.playerId,
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword
  });

  return sendOk(res, result);
}

export async function deletePlayerController(req: Request, res: Response) {
  const result = await softDeletePlayer({
    targetPlayerId: Number(req.params.playerId),
    requesterPlayerId: req.user!.playerId
  });

  return sendOk(res, result);
}
