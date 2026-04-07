import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import {
  buyDealerCarController,
  cancelSellController,
  getBrandOptionsController,
  getCountryOptionsController,
  getDealerCarsController,
  getUsedCarsController,
  purchaseUsedCarController,
  sellCarController
} from "./market.controller";
import {
  buyDealerCarBodySchema,
  cancelSellBodySchema,
  dealerCarsQuerySchema,
  purchaseUsedCarBodySchema,
  sellCarBodySchema,
  usedCarsQuerySchema
} from "./market.schemas";

const marketRouter = Router();

marketRouter.get("/options/brands", asyncHandler(getBrandOptionsController));
marketRouter.get("/options/countries", asyncHandler(getCountryOptionsController));
marketRouter.get(
  "/dealer/cars",
  validate({ query: dealerCarsQuerySchema }),
  asyncHandler(getDealerCarsController)
);
marketRouter.get(
  "/used-cars",
  optionalAuth,
  validate({ query: usedCarsQuerySchema }),
  asyncHandler(getUsedCarsController)
);

marketRouter.post(
  "/buy",
  requireAuth,
  validate({ body: buyDealerCarBodySchema }),
  asyncHandler(buyDealerCarController)
);
marketRouter.post(
  "/sell",
  requireAuth,
  validate({ body: sellCarBodySchema }),
  asyncHandler(sellCarController)
);
marketRouter.post(
  "/cancel-sell",
  requireAuth,
  validate({ body: cancelSellBodySchema }),
  asyncHandler(cancelSellController)
);
marketRouter.post(
  "/purchase-used",
  requireAuth,
  validate({ body: purchaseUsedCarBodySchema }),
  asyncHandler(purchaseUsedCarController)
);

export { marketRouter };
