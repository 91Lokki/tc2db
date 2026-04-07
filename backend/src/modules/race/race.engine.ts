import { gameRules, type GameRules } from "../../config/gameRules";

export type EngineCar = {
  ownedCarId: number;
  playerId: number;
  username: string;
  brandName: string;
  modelName: string;
  modelYear: number;
  power: number;
  topSpeed: number;
  mileage: number;
};

export type SimulatedRaceResult = EngineCar & {
  performanceIndex: number;
  effectiveSpeed: number;
  finishTimeMs: number;
  finishRank: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function centeredRandom(randomFn: () => number) {
  return randomFn() * 2 - 1;
}

function seededUnit(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

function getTrackBias(trackLength: number) {
  return clamp((trackLength - 2.5) / 2.5, 0, 1);
}

export function calculatePerformanceIndex(
  car: Pick<EngineCar, "power" | "topSpeed" | "mileage">,
  rules: GameRules = gameRules,
  trackLength = 4.5
) {
  const longTrackBias = getTrackBias(trackLength);
  const topSpeedMultiplier = 0.9 + longTrackBias * 0.3;
  const powerMultiplier = 1.1 - longTrackBias * 0.18;

  return (
    car.topSpeed * rules.topSpeedWeight * topSpeedMultiplier +
    car.power * rules.powerWeight * powerMultiplier -
    car.mileage * rules.mileageWearPenalty
  );
}

export function selectBestAvailableCar(
  cars: EngineCar[],
  rules: GameRules = gameRules,
  trackLength = 4.5
) {
  if (cars.length === 0) return null;

  return [...cars].sort((left, right) => {
    const leftScore = calculatePerformanceIndex(left, rules, trackLength);
    const rightScore = calculatePerformanceIndex(right, rules, trackLength);

    if (rightScore !== leftScore) return rightScore - leftScore;
    if (left.mileage !== right.mileage) return left.mileage - right.mileage;
    return left.ownedCarId - right.ownedCarId;
  })[0];
}

export function simulateRace(
  entrants: EngineCar[],
  trackLength: number,
  rules: GameRules = gameRules,
  randomFn: () => number = Math.random
): SimulatedRaceResult[] {
  const raceDistanceKm = trackLength * rules.distanceMultiplier;
  const longTrackBias = getTrackBias(trackLength);

  const results = entrants.map((entrant) => {
    const performanceIndex = calculatePerformanceIndex(entrant, rules, trackLength);
    const launchVariance = centeredRandom(randomFn) * (rules.randomVariancePct * 1.4);
    const paceVariance = centeredRandom(randomFn) * (rules.randomVariancePct * 2.1);
    const strategyVariance = centeredRandom(randomFn) * (rules.randomVariancePct * 1.25);
    const trafficVariance = centeredRandom(randomFn) * (rules.randomVariancePct * 0.75);
    const driverAffinity =
      1 + (seededUnit(`${entrant.playerId}:${Math.round(trackLength * 100)}`) - 0.5) * 0.08;
    const driverConsistency =
      1 + (seededUnit(`consistency:${entrant.playerId}`) - 0.5) * 0.05;
    const reliabilityRisk = clamp(
      0.02 +
        entrant.mileage / 120_000 +
        Math.max(0, entrant.power - 750) / 8_000 +
        longTrackBias * 0.04,
      0.03,
      0.24
    );
    const reliabilityPenalty =
      randomFn() < reliabilityRisk ? 1 + randomFn() * (0.08 + longTrackBias * 0.08) : 1;
    const effectiveSpeed = Math.max(
      rules.minimumEffectiveSpeed,
      Number(
        (
          performanceIndex *
          (1 + launchVariance) *
          (1 + paceVariance) *
          (1 + strategyVariance) *
          (1 + trafficVariance) *
          driverAffinity *
          driverConsistency
        ).toFixed(4)
      )
    );
    const finishTimeMs = Math.max(
      60_000,
      Math.round(((raceDistanceKm / effectiveSpeed) * 3_600_000) * reliabilityPenalty)
    );

    return {
      ...entrant,
      performanceIndex,
      effectiveSpeed,
      finishTimeMs,
      finishRank: 0
    };
  });

  const ranked = results.sort((left, right) => {
    if (left.finishTimeMs !== right.finishTimeMs) return left.finishTimeMs - right.finishTimeMs;
    if (right.power !== left.power) return right.power - left.power;
    if (left.mileage !== right.mileage) return left.mileage - right.mileage;
    return left.playerId - right.playerId;
  });

  return ranked.map((result, index) => ({
    ...result,
    finishRank: index + 1
  }));
}
