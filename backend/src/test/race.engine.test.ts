import { describe, expect, it } from "vitest";
import { gameRules } from "../config/gameRules";
import {
  calculatePerformanceIndex,
  selectBestAvailableCar,
  simulateRace,
  type EngineCar
} from "../modules/race/race.engine";

const cars: EngineCar[] = [
  {
    ownedCarId: 1,
    playerId: 10,
    username: "driver_one",
    brandName: "BrandA",
    modelName: "ModelX",
    modelYear: 2023,
    power: 600,
    topSpeed: 320,
    mileage: 1500
  },
  {
    ownedCarId: 2,
    playerId: 10,
    username: "driver_one",
    brandName: "BrandB",
    modelName: "ModelY",
    modelYear: 2024,
    power: 610,
    topSpeed: 325,
    mileage: 2200
  }
];

describe("race engine", () => {
  it("calculates a performance index that penalizes mileage", () => {
    const freshScore = calculatePerformanceIndex({ power: 600, topSpeed: 320, mileage: 0 }, gameRules);
    const wornScore = calculatePerformanceIndex({ power: 600, topSpeed: 320, mileage: 5000 }, gameRules);

    expect(freshScore).toBeGreaterThan(wornScore);
  });

  it("selects the highest performing available car", () => {
    const bestCar = selectBestAvailableCar(cars, gameRules);
    expect(bestCar?.ownedCarId).toBe(2);
  });

  it("changes the preferred car depending on track length", () => {
    const garage: EngineCar[] = [
      {
        ownedCarId: 11,
        playerId: 7,
        username: "track_reader",
        brandName: "BrandA",
        modelName: "SprintSpec",
        modelYear: 2023,
        power: 780,
        topSpeed: 290,
        mileage: 400
      },
      {
        ownedCarId: 12,
        playerId: 7,
        username: "track_reader",
        brandName: "BrandB",
        modelName: "TopEnd",
        modelYear: 2024,
        power: 630,
        topSpeed: 365,
        mileage: 400
      }
    ];

    expect(selectBestAvailableCar(garage, gameRules, 2.5)?.ownedCarId).toBe(11);
    expect(selectBestAvailableCar(garage, gameRules, 5.0)?.ownedCarId).toBe(12);
  });

  it("produces deterministic ranks when a fixed random source is supplied", () => {
    const entrants: EngineCar[] = [
      {
        ownedCarId: 3,
        playerId: 1,
        username: "alpha",
        brandName: "BrandA",
        modelName: "One",
        modelYear: 2023,
        power: 620,
        topSpeed: 330,
        mileage: 500
      },
      {
        ownedCarId: 4,
        playerId: 2,
        username: "beta",
        brandName: "BrandB",
        modelName: "Two",
        modelYear: 2022,
        power: 580,
        topSpeed: 315,
        mileage: 500
      }
    ];

    const randomFn = () => 0.5;
    const results = simulateRace(entrants, 5.7, gameRules, randomFn);

    expect(results[0]?.username).toBe("alpha");
    expect(results[0]?.finishRank).toBe(1);
    expect(results[1]?.finishRank).toBe(2);
    expect(results[0]?.finishTimeMs).toBeLessThan(results[1]?.finishTimeMs ?? 0);
  });
});
