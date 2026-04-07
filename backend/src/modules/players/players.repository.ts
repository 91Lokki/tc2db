import { prisma } from "../../lib/prisma";

export function findPlayerProfileBase(username: string) {
  return prisma.player.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      username: true,
      money: true,
      isAdmin: true,
      regDate: true,
      accountStatus: true,
      deletedAt: true
    }
  });
}

export function getGarageRows(playerId: number) {
  return prisma.ownedCar.findMany({
    where: { playerId },
    include: {
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
    orderBy: [{ onSale: "desc" }, { obtainDate: "desc" }]
  });
}

export function getTransactionRows(playerId: number) {
  return prisma.moneyTransaction.findMany({
    where: { playerId },
    orderBy: {
      transTime: "desc"
    }
  });
}

export function getRaceResultRows(playerId: number) {
  return prisma.raceResult.findMany({
    where: { playerId },
    include: {
      raceSchedule: {
        include: {
          track: true
        }
      },
      ownedCar: {
        include: {
          model: {
            include: {
              brand: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export function getRecentRaceRows(playerId: number, take = 10) {
  return prisma.raceResult.findMany({
    where: { playerId },
    include: {
      raceSchedule: {
        include: {
          track: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take
  });
}

export function getSeasonPointRowsForPlayer(playerId: number) {
  return prisma.seasonPoints.findMany({
    where: { playerId },
    orderBy: {
      seasonYear: "asc"
    }
  });
}

export function getAllSeasonPointRows() {
  return prisma.seasonPoints.findMany({
    include: {
      player: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: [
      {
        seasonYear: "asc"
      },
      {
        totalPoints: "desc"
      }
    ]
  });
}

export async function getLatestSeasonYear() {
  const latestSchedule = await prisma.raceSchedule.findFirst({
    orderBy: {
      seasonYear: "desc"
    },
    select: {
      seasonYear: true
    }
  });

  return latestSchedule?.seasonYear ?? null;
}
