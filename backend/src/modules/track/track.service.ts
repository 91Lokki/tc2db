import { prisma } from "../../lib/prisma";

export async function getTrackYears() {
  const rows = await prisma.raceSchedule.findMany({
    distinct: ["seasonYear"],
    select: {
      seasonYear: true
    },
    orderBy: {
      seasonYear: "asc"
    }
  });

  return rows.map((row) => row.seasonYear);
}

export async function getTrackOptions() {
  const rows = await prisma.track.findMany({
    orderBy: {
      name: "asc"
    }
  });

  return rows.map((row) => ({
    name: row.name,
    length: row.length,
    imageUrl: row.imageUrl
  }));
}

type TrackHistoryFilters = {
  trackName: string;
  year?: number | "all";
  playerName?: string;
  carName?: string;
};

export async function getTrackHistory(filters: TrackHistoryFilters) {
  const rows = await prisma.raceResult.findMany({
    where: {
      raceSchedule: {
        track: {
          name: {
            equals: filters.trackName,
            mode: "insensitive"
          }
        },
        ...(filters.year && filters.year !== "all" ? { seasonYear: filters.year } : {})
      },
      ...(filters.playerName
        ? {
            player: {
              username: {
                contains: filters.playerName,
                mode: "insensitive"
              }
            }
          }
        : {})
    },
    include: {
      player: {
        select: {
          username: true
        }
      },
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
    orderBy: [{ finishTimeMs: "asc" }, { createdAt: "asc" }]
  });

  const filteredRows = rows.filter((row) => {
    if (!filters.carName) return true;
    const displayCarName = `${row.ownedCar.model.brand.name} ${row.ownedCar.model.name}`.toLowerCase();
    return displayCarName.includes(filters.carName.toLowerCase());
  });

  return filteredRows.map((row, index) => ({
    rank: index + 1,
    playerName: row.player.username,
    carName: `${row.ownedCar.model.brand.name} ${row.ownedCar.model.name}`,
    finishTime: row.finishTimeMs,
    raceDate: row.raceSchedule.raceDate.toISOString().slice(0, 10)
  }));
}
