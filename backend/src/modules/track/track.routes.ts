import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  getTrackHistoryController,
  getTrackOptionsController,
  getTrackYearsController
} from "./track.controller";
import { trackHistoryQuerySchema } from "./track.schemas";

const trackRouter = Router();

trackRouter.get("/options/years", asyncHandler(getTrackYearsController));
trackRouter.get("/options/tracks", asyncHandler(getTrackOptionsController));
trackRouter.get(
  "/history",
  validate({
    query: trackHistoryQuerySchema
  }),
  asyncHandler(getTrackHistoryController)
);

export { trackRouter };
