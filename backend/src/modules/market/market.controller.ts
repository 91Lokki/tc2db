import type { Request, Response } from "express";
import { sendOk } from "../../shared/http/api-response";
import {
  buyDealerCar,
  cancelCarSale,
  getBrandOptions,
  getCountryOptions,
  getDealerCars,
  getUsedCars,
  purchaseUsedCar,
  putCarOnSale
} from "./market.service";

export async function getBrandOptionsController(_req: Request, res: Response) {
  return sendOk(res, await getBrandOptions());
}

export async function getCountryOptionsController(_req: Request, res: Response) {
  return sendOk(res, await getCountryOptions());
}

export async function getDealerCarsController(req: Request, res: Response) {
  return sendOk(
    res,
    await getDealerCars({
      brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
      country: typeof req.query.country === "string" ? req.query.country : undefined,
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      minYear: req.query.minYear ? Number(req.query.minYear) : undefined,
      maxYear: req.query.maxYear ? Number(req.query.maxYear) : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined
    })
  );
}

export async function getUsedCarsController(req: Request, res: Response) {
  return sendOk(
    res,
    await getUsedCars(
      {
        q: typeof req.query.q === "string" ? req.query.q : undefined,
        country: typeof req.query.country === "string" ? req.query.country : undefined,
        minYear: req.query.minYear ? Number(req.query.minYear) : undefined,
        maxYear: req.query.maxYear ? Number(req.query.maxYear) : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined
      },
      req.user?.playerId
    )
  );
}

export async function buyDealerCarController(req: Request, res: Response) {
  return sendOk(
    res,
    await buyDealerCar(req.body.buyerId, req.body.modelId, req.user!.playerId)
  );
}

export async function sellCarController(req: Request, res: Response) {
  return sendOk(
    res,
    await putCarOnSale(req.body.sellerId, req.body.carId, req.body.price, req.user!.playerId)
  );
}

export async function cancelSellController(req: Request, res: Response) {
  return sendOk(
    res,
    await cancelCarSale(req.body.sellerId, req.body.carId, req.user!.playerId)
  );
}

export async function purchaseUsedCarController(req: Request, res: Response) {
  return sendOk(
    res,
    await purchaseUsedCar(req.body.buyerId, req.body.carId, req.user!.playerId)
  );
}
