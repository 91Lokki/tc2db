import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";

type DealerFilters = {
  brand?: string;
  country?: string;
  q?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
};

type UsedFilters = {
  q?: string;
  country?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
};

const serializable = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
};

function assertActor(expectedPlayerId: number, authenticatedPlayerId: number) {
  if (expectedPlayerId !== authenticatedPlayerId) {
    throw new AppError(403, "Authenticated player does not match request body", "FORBIDDEN");
  }
}

export async function getBrandOptions() {
  const rows = await prisma.brand.findMany({
    include: {
      country: true
    },
    orderBy: {
      name: "asc"
    }
  });

  return rows.map((row) => ({
    name: row.name,
    imageUrl: row.logoUrl,
    countryFlagUrl: row.country.flagUrl
  }));
}

export async function getCountryOptions() {
  const rows = await prisma.country.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      name: true
    }
  });

  return rows.map((row) => row.name);
}

export async function getDealerCars(filters: DealerFilters) {
  const where: Prisma.CarModelWhereInput = {};

  if (filters.brand || filters.country) {
    where.brand = {
      ...(filters.brand
        ? {
            name: {
              equals: filters.brand,
              mode: "insensitive"
            }
          }
        : {}),
      ...(filters.country
        ? {
            country: {
              name: {
                equals: filters.country,
                mode: "insensitive"
              }
            }
          }
        : {})
    };
  }

  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.modelYear = {
      ...(filters.minYear !== undefined ? { gte: filters.minYear } : {}),
      ...(filters.maxYear !== undefined ? { lte: filters.maxYear } : {})
    };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
    };
  }

  if (filters.q) {
    where.OR = [
      {
        name: {
          contains: filters.q,
          mode: "insensitive"
        }
      },
      {
        brand: {
          name: {
            contains: filters.q,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  const rows = await prisma.carModel.findMany({
    where,
    include: {
      brand: {
        include: {
          country: true
        }
      }
    },
    orderBy: [{ brand: { name: "asc" } }, { basePrice: "asc" }]
  });

  return rows.map((row) => ({
    modelId: row.id,
    modelName: row.name,
    brandName: row.brand.name,
    countryName: row.brand.country.name,
    modelYear: row.modelYear,
    basePrice: row.basePrice,
    stockQuantity: row.stockQuantity,
    power: row.power,
    topSpeed: row.topSpeed,
    carUrl: row.carUrl,
    brandLogoUrl: row.brand.logoUrl,
    countryFlagUrl: row.brand.country.flagUrl
  }));
}

export async function getUsedCars(filters: UsedFilters, requesterPlayerId?: number) {
  const where: Prisma.OwnedCarWhereInput = {
    onSale: true
  };

  if (requesterPlayerId) {
    where.playerId = {
      not: requesterPlayerId
    };
  }

  if (filters.country || filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.model = {
      ...(filters.country
        ? {
            brand: {
              country: {
                name: {
                  equals: filters.country,
                  mode: "insensitive"
                }
              }
            }
          }
        : {}),
      ...(filters.minYear !== undefined || filters.maxYear !== undefined
        ? {
            modelYear: {
              ...(filters.minYear !== undefined ? { gte: filters.minYear } : {}),
              ...(filters.maxYear !== undefined ? { lte: filters.maxYear } : {})
            }
          }
        : {})
    };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.salePrice = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
    };
  }

  if (filters.q) {
    where.OR = [
      {
        player: {
          username: {
            contains: filters.q,
            mode: "insensitive"
          }
        }
      },
      {
        model: {
          name: {
            contains: filters.q,
            mode: "insensitive"
          }
        }
      },
      {
        model: {
          brand: {
            name: {
              contains: filters.q,
              mode: "insensitive"
            }
          }
        }
      }
    ];
  }

  const rows = await prisma.ownedCar.findMany({
    where,
    include: {
      player: {
        select: {
          id: true,
          username: true
        }
      },
      model: {
        include: {
          brand: {
            include: {
              country: true
            }
          }
        }
      }
    },
    orderBy: {
      listingDate: "desc"
    }
  });

  return rows.map((row) => ({
    carId: row.id,
    sellerId: row.player.id,
    sellerName: row.player.username,
    brandName: row.model.brand.name,
    modelName: row.model.name,
    modelYear: row.model.modelYear,
    countryName: row.model.brand.country.name,
    salePrice: row.salePrice,
    listingDate: row.listingDate,
    mileage: row.mileage,
    carUrl: row.model.carUrl,
    countryFlagUrl: row.model.brand.country.flagUrl
  }));
}

export async function buyDealerCar(
  buyerId: number,
  modelId: number,
  authenticatedPlayerId: number
) {
  assertActor(buyerId, authenticatedPlayerId);

  return prisma.$transaction(async (tx) => {
    const [buyer, model] = await Promise.all([
      tx.player.findUnique({
        where: { id: buyerId }
      }),
      tx.carModel.findUnique({
        where: { id: modelId },
        include: {
          brand: true
        }
      })
    ]);

    if (!buyer || buyer.accountStatus !== "ACTIVE" || buyer.deletedAt) {
      throw new AppError(404, "Buyer not found", "PLAYER_NOT_FOUND");
    }

    if (!model) {
      throw new AppError(404, "Car model not found", "MODEL_NOT_FOUND");
    }

    if (model.stockQuantity <= 0) {
      throw new AppError(409, "Dealer car is out of stock", "OUT_OF_STOCK");
    }

    if (buyer.money < model.basePrice) {
      throw new AppError(400, "Insufficient funds", "INSUFFICIENT_FUNDS");
    }

    const stockUpdate = await tx.carModel.updateMany({
      where: {
        id: model.id,
        stockQuantity: {
          gt: 0
        }
      },
      data: {
        stockQuantity: {
          decrement: 1
        }
      }
    });

    if (stockUpdate.count !== 1) {
      throw new AppError(409, "Dealer stock changed, please retry", "STALE_STOCK");
    }

    const buyerUpdate = await tx.player.updateMany({
      where: {
        id: buyer.id,
        money: {
          gte: model.basePrice
        },
        accountStatus: "ACTIVE"
      },
      data: {
        money: {
          decrement: model.basePrice
        }
      }
    });

    if (buyerUpdate.count !== 1) {
      throw new AppError(409, "Buyer balance changed, please retry", "STALE_BALANCE");
    }

    const ownedCar = await tx.ownedCar.create({
      data: {
        playerId: buyer.id,
        modelId: model.id
      }
    });

    await tx.moneyTransaction.create({
      data: {
        playerId: buyer.id,
        type: "DEALER_PURCHASE",
        amount: -model.basePrice,
        description: `Purchased ${model.brand.name} ${model.name} (${model.modelYear}) from dealer`
      }
    });

    const updatedBuyer = await tx.player.findUniqueOrThrow({
      where: { id: buyer.id },
      select: { money: true }
    });

    return {
      success: true,
      money: updatedBuyer.money,
      carId: ownedCar.id,
      modelId: model.id
    };
  }, serializable);
}

export async function putCarOnSale(
  sellerId: number,
  carId: number,
  price: number,
  authenticatedPlayerId: number
) {
  assertActor(sellerId, authenticatedPlayerId);

  return prisma.$transaction(async (tx) => {
    const ownedCar = await tx.ownedCar.findFirst({
      where: {
        id: carId,
        playerId: sellerId
      },
      include: {
        model: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!ownedCar) {
      throw new AppError(404, "Car not found in seller garage", "CAR_NOT_FOUND");
    }

    if (ownedCar.onSale) {
      throw new AppError(409, "Car is already listed for sale", "CAR_ALREADY_ON_SALE");
    }

    await tx.ownedCar.update({
      where: { id: ownedCar.id },
      data: {
        onSale: true,
        salePrice: price,
        listingDate: new Date()
      }
    });

    await tx.moneyTransaction.create({
      data: {
        playerId: sellerId,
        type: "LISTING_CREATED",
        amount: 0,
        description: `Listed ${ownedCar.model.brand.name} ${ownedCar.model.name} for sale`,
        counterpartyName: null
      }
    });

    return {
      success: true,
      carId: ownedCar.id,
      salePrice: price
    };
  });
}

export async function cancelCarSale(
  sellerId: number,
  carId: number,
  authenticatedPlayerId: number
) {
  assertActor(sellerId, authenticatedPlayerId);

  return prisma.$transaction(async (tx) => {
    const ownedCar = await tx.ownedCar.findFirst({
      where: {
        id: carId,
        playerId: sellerId
      },
      include: {
        model: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!ownedCar) {
      throw new AppError(404, "Car not found in seller garage", "CAR_NOT_FOUND");
    }

    if (!ownedCar.onSale) {
      throw new AppError(409, "Car is not listed for sale", "CAR_NOT_ON_SALE");
    }

    await tx.ownedCar.update({
      where: { id: ownedCar.id },
      data: {
        onSale: false,
        salePrice: null,
        listingDate: null
      }
    });

    await tx.moneyTransaction.create({
      data: {
        playerId: sellerId,
        type: "LISTING_CANCELLED",
        amount: 0,
        description: `Cancelled sale listing for ${ownedCar.model.brand.name} ${ownedCar.model.name}`
      }
    });

    return {
      success: true,
      carId: ownedCar.id
    };
  });
}

export async function purchaseUsedCar(
  buyerId: number,
  carId: number,
  authenticatedPlayerId: number
) {
  assertActor(buyerId, authenticatedPlayerId);

  return prisma.$transaction(async (tx) => {
    const [buyer, listing] = await Promise.all([
      tx.player.findUnique({
        where: { id: buyerId }
      }),
      tx.ownedCar.findUnique({
        where: { id: carId },
        include: {
          player: true,
          model: {
            include: {
              brand: true
            }
          }
        }
      })
    ]);

    if (!buyer || buyer.accountStatus !== "ACTIVE" || buyer.deletedAt) {
      throw new AppError(404, "Buyer not found", "PLAYER_NOT_FOUND");
    }

    if (!listing || !listing.onSale || listing.salePrice === null) {
      throw new AppError(404, "Used car listing not found", "LISTING_NOT_FOUND");
    }

    if (listing.playerId === buyerId) {
      throw new AppError(400, "You cannot buy your own listing", "SELF_PURCHASE_FORBIDDEN");
    }

    if (buyer.money < listing.salePrice) {
      throw new AppError(400, "Insufficient funds", "INSUFFICIENT_FUNDS");
    }

    const buyerUpdate = await tx.player.updateMany({
      where: {
        id: buyer.id,
        money: {
          gte: listing.salePrice
        },
        accountStatus: "ACTIVE"
      },
      data: {
        money: {
          decrement: listing.salePrice
        }
      }
    });

    if (buyerUpdate.count !== 1) {
      throw new AppError(409, "Buyer balance changed, please retry", "STALE_BALANCE");
    }

    await tx.player.update({
      where: { id: listing.playerId },
      data: {
        money: {
          increment: listing.salePrice
        }
      }
    });

    const transferUpdate = await tx.ownedCar.updateMany({
      where: {
        id: listing.id,
        playerId: listing.playerId,
        onSale: true,
        salePrice: listing.salePrice
      },
      data: {
        playerId: buyer.id,
        onSale: false,
        salePrice: null,
        listingDate: null,
        obtainDate: new Date()
      }
    });

    if (transferUpdate.count !== 1) {
      throw new AppError(409, "Listing changed before purchase completed", "STALE_LISTING");
    }

    const carName = `${listing.model.brand.name} ${listing.model.name}`;

    await tx.moneyTransaction.createMany({
      data: [
        {
          playerId: buyer.id,
          type: "USED_PURCHASE",
          amount: -listing.salePrice,
          description: `Purchased used ${carName}`,
          counterpartyName: listing.player.username
        },
        {
          playerId: listing.playerId,
          type: "USED_SALE",
          amount: listing.salePrice,
          description: `Sold ${carName}`,
          counterpartyName: buyer.username
        }
      ]
    });

    const updatedBuyer = await tx.player.findUniqueOrThrow({
      where: { id: buyer.id },
      select: { money: true }
    });

    return {
      success: true,
      money: updatedBuyer.money,
      carId: listing.id
    };
  }, serializable);
}
