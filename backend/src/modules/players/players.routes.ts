import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { changePasswordBodySchema, loginBodySchema, playerIdParamSchema, registerBodySchema } from "../auth/auth.schemas";
import { changePasswordController, deletePlayerController, loginController, registerController } from "../auth/auth.controller";
import { profileParamsSchema, profileQuerySchema } from "./player.schemas";
import { getGarageController, getProfileController } from "./players.controller";

const playersRouter = Router();

playersRouter.post(
  "/register",
  validate({ body: registerBodySchema }),
  asyncHandler(registerController)
);

playersRouter.post(
  "/login",
  validate({ body: loginBodySchema }),
  asyncHandler(loginController)
);

playersRouter.put(
  "/:playerId/password",
  requireAuth,
  validate({ params: playerIdParamSchema, body: changePasswordBodySchema }),
  asyncHandler(changePasswordController)
);

playersRouter.delete(
  "/:playerId",
  requireAuth,
  validate({ params: playerIdParamSchema }),
  asyncHandler(deletePlayerController)
);

playersRouter.get(
  "/profile/:username",
  optionalAuth,
  validate({ params: profileParamsSchema, query: profileQuerySchema }),
  asyncHandler(getProfileController)
);

playersRouter.get("/garage", requireAuth, asyncHandler(getGarageController));

export { playersRouter };
