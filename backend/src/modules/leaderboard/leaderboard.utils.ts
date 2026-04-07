export type StandingSnapshot = {
  playerId: number;
  username: string;
  totalPoints: number;
  winCount: number;
  podiumCount: number;
  raceCount: number;
};

export type RankedStanding = StandingSnapshot & {
  rank: number;
};

export function sortStandings(rows: StandingSnapshot[]): StandingSnapshot[] {
  return [...rows].sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) return right.totalPoints - left.totalPoints;
    if (right.winCount !== left.winCount) return right.winCount - left.winCount;
    if (right.podiumCount !== left.podiumCount) return right.podiumCount - left.podiumCount;
    if (right.raceCount !== left.raceCount) return right.raceCount - left.raceCount;
    return left.username.localeCompare(right.username);
  });
}

export function rankStandings(rows: StandingSnapshot[]): RankedStanding[] {
  return sortStandings(rows).map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}
