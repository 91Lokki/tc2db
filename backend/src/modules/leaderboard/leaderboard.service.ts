import { prisma } from "../../lib/prisma";
import { rankStandings } from "./leaderboard.utils";

function matchesPlayerName(username: string, playerName?: string) {
  if (!playerName) return true;
  return username.toLowerCase() === playerName.toLowerCase();
}

export async function getLeaderboardStandings(year: number | "all", playerName?: string) {
  if (year === "all") {
    const raceResults = await prisma.raceResult.findMany({
      include: {
        player: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    const standingsMap = new Map<
      number,
      {
        playerId: number;
        username: string;
        totalPoints: number;
        winCount: number;
        podiumCount: number;
        raceCount: number;
      }
    >();

    for (const result of raceResults) {
      const existing = standingsMap.get(result.playerId) ?? {
        playerId: result.playerId,
        username: result.player.username,
        totalPoints: 0,
        winCount: 0,
        podiumCount: 0,
        raceCount: 0
      };

      existing.totalPoints += result.pointsAwarded;
      existing.raceCount += 1;
      if (result.finishRank === 1) existing.winCount += 1;
      if (result.finishRank <= 3) existing.podiumCount += 1;

      standingsMap.set(result.playerId, existing);
    }

    return rankStandings([...standingsMap.values()]).filter((row) =>
      matchesPlayerName(row.username, playerName)
    );
  }

  const seasonPoints = await prisma.seasonPoints.findMany({
    where: {
      seasonYear: year
    },
    include: {
      player: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  return rankStandings(
    seasonPoints.map((row) => ({
      playerId: row.playerId,
      username: row.player.username,
      totalPoints: row.totalPoints,
      winCount: row.winCount,
      podiumCount: row.podiumCount,
      raceCount: row.raceCount
    }))
  ).filter((row) => matchesPlayerName(row.username, playerName));
}
