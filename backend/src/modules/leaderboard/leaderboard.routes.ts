import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { getLeaderboardStandingsController } from "./leaderboard.controller";
import { standingsParamsSchema, standingsQuerySchema } from "./leaderboard.schemas";

const leaderboardRouter = Router();

leaderboardRouter.get(
  "/standings/:year",
  validate({
    params: standingsParamsSchema,
    query: standingsQuerySchema
  }),
  asyncHandler(getLeaderboardStandingsController)
);

export { leaderboardRouter };
