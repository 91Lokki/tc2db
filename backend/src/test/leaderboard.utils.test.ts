import { describe, expect, it } from "vitest";
import { rankStandings } from "../modules/leaderboard/leaderboard.utils";

describe("rankStandings", () => {
  it("sorts by points then wins then podiums then races then username", () => {
    const ranked = rankStandings([
      {
        playerId: 1,
        username: "beta",
        totalPoints: 30,
        winCount: 2,
        podiumCount: 3,
        raceCount: 4
      },
      {
        playerId: 2,
        username: "alpha",
        totalPoints: 30,
        winCount: 2,
        podiumCount: 3,
        raceCount: 5
      },
      {
        playerId: 3,
        username: "gamma",
        totalPoints: 34,
        winCount: 1,
        podiumCount: 2,
        raceCount: 4
      }
    ]);

    expect(ranked.map((row) => row.username)).toEqual(["gamma", "alpha", "beta"]);
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3]);
  });
});
