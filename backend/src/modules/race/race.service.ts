import { Prisma } from "@prisma/client";
import { gameRules } from "../../config/gameRules";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { selectBestAvailableCar, simulateRace, type EngineCar } from "./race.engine";

const serializable = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
};

function buildNextRaceDto(
  schedule:
    | {
        status: "PENDING" | "COMPLETED";
        seasonYear: number;
        roundNumber: number;
        raceDate: Date;
        track: {
          name: string;
          imageUrl: string | null;
        };
      }
    | null,
  totalRounds: number
) {
  if (!schedule) return null;

  return {
    status: "Pending",
    seasonYear: schedule.seasonYear,
    round: schedule.roundNumber,
    totalRounds,
    raceDate: schedule.raceDate.toISOString().slice(0, 10),
    trackName: schedule.track.name,
    trackUrl: schedule.track.imageUrl,
    isFinal: schedule.roundNumber === totalRounds
  };
}

export async function getNextGlobalRace() {
  const nextRace = await prisma.raceSchedule.findFirst({
    where: {
      status: "PENDING"
    },
    include: {
      track: true
    },
    orderBy: [{ seasonYear: "asc" }, { roundNumber: "asc" }]
  });

  if (!nextRace) {
    const latestSchedule = await prisma.raceSchedule.findFirst({
      orderBy: {
        seasonYear: "desc"
      },
      select: {
        seasonYear: true
      }
    });

    return {
      status: "Finished",
      nextSeasonYear: (latestSchedule?.seasonYear ?? new Date().getFullYear()) + 1
    };
  }

  const totalRounds = await prisma.raceSchedule.count({
    where: {
      seasonYear: nextRace.seasonYear
    }
  });

  return buildNextRaceDto(nextRace, totalRounds);
}

function cloneRaceDateForSeason(sourceDate: Date, targetYear: number) {
  return new Date(
    Date.UTC(
      targetYear,
      sourceDate.getUTCMonth(),
      sourceDate.getUTCDate(),
      sourceDate.getUTCHours(),
      sourceDate.getUTCMinutes(),
      sourceDate.getUTCSeconds(),
      sourceDate.getUTCMilliseconds()
    )
  );
}

export async function createSeasonSchedule(seasonYear: number) {
  return prisma.$transaction(async (tx) => {
    const existingSeasonCount = await tx.raceSchedule.count({
      where: {
        seasonYear
      }
    });

    if (existingSeasonCount > 0) {
      const nextRace = await tx.raceSchedule.findFirst({
        where: {
          seasonYear,
          status: "PENDING"
        },
        include: {
          track: true
        },
        orderBy: {
          roundNumber: "asc"
        }
      });

      return {
        seasonYear,
        created: false,
        totalRounds: existingSeasonCount,
        nextRace: nextRace
          ? buildNextRaceDto(nextRace, existingSeasonCount)
          : null
      };
    }

    const templateSeason = await tx.raceSchedule.findMany({
      where: {
        seasonYear: {
          lt: seasonYear
        }
      },
      include: {
        track: true
      },
      orderBy: [{ seasonYear: "desc" }, { roundNumber: "asc" }]
    });

    if (templateSeason.length === 0) {
      throw new AppError(404, "No existing season schedule available to clone", "SEASON_TEMPLATE_NOT_FOUND");
    }

    const templateYear = templateSeason[0].seasonYear;
    const templateRounds = templateSeason.filter((row) => row.seasonYear === templateYear);

    await tx.raceSchedule.createMany({
      data: templateRounds.map((round) => ({
        seasonYear,
        roundNumber: round.roundNumber,
        trackId: round.trackId,
        raceDate: cloneRaceDateForSeason(round.raceDate, seasonYear),
        status: "PENDING"
      }))
    });

    const nextRace = await tx.raceSchedule.findFirst({
      where: {
        seasonYear,
        status: "PENDING"
      },
      include: {
        track: true
      },
      orderBy: {
        roundNumber: "asc"
      }
    });

    return {
      seasonYear,
      created: true,
      totalRounds: templateRounds.length,
      nextRace: nextRace ? buildNextRaceDto(nextRace, templateRounds.length) : null
    };
  }, serializable);
}

export async function getNextScheduleForYear(year: number) {
  const nextRace = await prisma.raceSchedule.findFirst({
    where: {
      seasonYear: year,
      status: "PENDING"
    },
    include: {
      track: true
    },
    orderBy: {
      roundNumber: "asc"
    }
  });

  if (!nextRace) return null;

  const totalRounds = await prisma.raceSchedule.count({
    where: {
      seasonYear: year
    }
  });

  return buildNextRaceDto(nextRace, totalRounds);
}

export async function getSeasonSchedule(year: number) {
  const rows = await prisma.raceSchedule.findMany({
    where: {
      seasonYear: year
    },
    include: {
      track: true
    },
    orderBy: {
      roundNumber: "asc"
    }
  });

  return rows.map((row) => ({
    roundNumber: row.roundNumber,
    trackName: row.track.name,
    raceDate: row.raceDate.toISOString().slice(0, 10),
    top1: row.top1Name,
    top2: row.top2Name,
    top3: row.top3Name,
    isCompleted: row.status === "COMPLETED"
  }));
}

function mapEligibleCars(
  players: Array<{
    id: number;
    username: string;
    ownedCars: Array<{
      id: number;
      mileage: number;
      model: {
        name: string;
        modelYear: number;
        power: number;
        topSpeed: number;
        brand: {
          name: string;
        };
      };
    }>;
  }>,
  trackLength: number
) {
  const entrants: EngineCar[] = [];

  for (const player of players) {
    const candidate = selectBestAvailableCar(
      player.ownedCars.map((car) => ({
        ownedCarId: car.id,
        playerId: player.id,
        username: player.username,
        brandName: car.model.brand.name,
        modelName: car.model.name,
        modelYear: car.model.modelYear,
        power: car.model.power,
        topSpeed: car.model.topSpeed,
        mileage: car.mileage
      })),
      gameRules,
      trackLength
    );

    if (candidate) entrants.push(candidate);
  }

  return entrants;
}

export async function simulateNextRaceForSeason(seasonYear: number) {
  return prisma.$transaction(async (tx) => {
    const nextRace = await tx.raceSchedule.findFirst({
      where: {
        seasonYear,
        status: "PENDING"
      },
      include: {
        track: true
      },
      orderBy: {
        roundNumber: "asc"
      }
    });

    if (!nextRace) {
      throw new AppError(404, "No pending race found for the requested season", "RACE_NOT_FOUND");
    }

    const players = await tx.player.findMany({
      where: {
        accountStatus: "ACTIVE",
        deletedAt: null,
        ownedCars: {
          some: {
            onSale: false
          }
        }
      },
      include: {
        ownedCars: {
          where: {
            onSale: false
          },
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });

    const entrants = mapEligibleCars(players, nextRace.track.length);
    if (entrants.length === 0) {
      throw new AppError(409, "No eligible entrants found", "NO_ELIGIBLE_ENTRANTS");
    }

    const simulated = simulateRace(entrants, nextRace.track.length, gameRules);
    const mileageGain = Math.ceil(nextRace.track.length * gameRules.distanceMultiplier);
    const podium = simulated.slice(0, 3);

    await tx.raceResult.createMany({
      data: simulated.map((result) => ({
        raceScheduleId: nextRace.id,
        playerId: result.playerId,
        ownedCarId: result.ownedCarId,
        finishRank: result.finishRank,
        finishTimeMs: result.finishTimeMs,
        pointsAwarded: gameRules.pointsTable[result.finishRank - 1] ?? 0,
        prizeMoney: gameRules.prizeMoneyTable[result.finishRank - 1] ?? 0
      }))
    });

    for (const result of simulated) {
      const pointsAwarded = gameRules.pointsTable[result.finishRank - 1] ?? 0;
      const prizeMoney = gameRules.prizeMoneyTable[result.finishRank - 1] ?? 0;

      await tx.seasonPoints.upsert({
        where: {
          seasonYear_playerId: {
            seasonYear,
            playerId: result.playerId
          }
        },
        update: {
          totalPoints: {
            increment: pointsAwarded
          },
          winCount: {
            increment: result.finishRank === 1 ? 1 : 0
          },
          podiumCount: {
            increment: result.finishRank <= 3 ? 1 : 0
          },
          raceCount: {
            increment: 1
          }
        },
        create: {
          seasonYear,
          playerId: result.playerId,
          totalPoints: pointsAwarded,
          winCount: result.finishRank === 1 ? 1 : 0,
          podiumCount: result.finishRank <= 3 ? 1 : 0,
          raceCount: 1
        }
      });

      await tx.ownedCar.update({
        where: { id: result.ownedCarId },
        data: {
          mileage: {
            increment: mileageGain
          }
        }
      });

      if (prizeMoney > 0) {
        await tx.player.update({
          where: { id: result.playerId },
          data: {
            money: {
              increment: prizeMoney
            }
          }
        });

        await tx.moneyTransaction.create({
          data: {
            playerId: result.playerId,
            type: "RACE_PRIZE",
            amount: prizeMoney,
            description: `Race prize for ${nextRace.track.name} round ${nextRace.roundNumber}`
          }
        });
      }
    }

    const scheduleUpdate = await tx.raceSchedule.updateMany({
      where: {
        id: nextRace.id,
        status: "PENDING"
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        top1PlayerId: podium[0]?.playerId ?? null,
        top1Name: podium[0]?.username ?? null,
        top2PlayerId: podium[1]?.playerId ?? null,
        top2Name: podium[1]?.username ?? null,
        top3PlayerId: podium[2]?.playerId ?? null,
        top3Name: podium[2]?.username ?? null
      }
    });

    if (scheduleUpdate.count !== 1) {
      throw new AppError(409, "Race status changed before commit", "STALE_RACE_STATE");
    }

    return {
      seasonYear,
      round: nextRace.roundNumber,
      trackName: nextRace.track.name,
      results: simulated.map((result) => ({
        rank: result.finishRank,
        username: result.username,
        carName: `${result.brandName} ${result.modelName}`,
        finishTime: result.finishTimeMs,
        pointsAwarded: gameRules.pointsTable[result.finishRank - 1] ?? 0,
        prizeMoney: gameRules.prizeMoneyTable[result.finishRank - 1] ?? 0
      }))
    };
  }, serializable);
}
