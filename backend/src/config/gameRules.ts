export type GameRules = {
  startingMoney: number;
  distanceMultiplier: number;
  topSpeedWeight: number;
  powerWeight: number;
  mileageWearPenalty: number;
  randomVariancePct: number;
  minimumEffectiveSpeed: number;
  pointsTable: number[];
  prizeMoneyTable: number[];
};

export const gameRules: GameRules = {
  startingMoney: 1_000_000,
  distanceMultiplier: 12,
  topSpeedWeight: 0.62,
  powerWeight: 0.38,
  mileageWearPenalty: 0.015,
  randomVariancePct: 0.05,
  minimumEffectiveSpeed: 60,
  pointsTable: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  prizeMoneyTable: [250_000, 175_000, 120_000, 80_000, 60_000, 45_000, 35_000, 20_000, 12_000, 8_000]
};
