import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  createSeasonController,
  getNextGlobalRaceController,
  getNextScheduleController,
  getSeasonScheduleController,
  simulateNextRaceController
} from "./race.controller";
import {
  createSeasonBodySchema,
  seasonYearParamSchema,
  simulateRaceBodySchema
} from "./race.schemas";

const raceRouter = Router();

raceRouter.get("/next-global", asyncHandler(getNextGlobalRaceController));
raceRouter.get(
  "/next-schedule/:year",
  validate({ params: seasonYearParamSchema }),
  asyncHandler(getNextScheduleController)
);
raceRouter.get(
  "/schedules/:year",
  validate({ params: seasonYearParamSchema }),
  asyncHandler(getSeasonScheduleController)
);
raceRouter.post(
  "/simulate-next",
  requireAdmin,
  validate({ body: simulateRaceBodySchema }),
  asyncHandler(simulateNextRaceController)
);
raceRouter.post(
  "/new-season",
  requireAdmin,
  validate({ body: createSeasonBodySchema }),
  asyncHandler(createSeasonController)
);

export { raceRouter };
