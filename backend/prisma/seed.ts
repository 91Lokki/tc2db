import "dotenv/config";

import bcrypt from "bcrypt";
import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { gameRules } from "../src/config/gameRules";

const prisma = new PrismaClient();

type CsvSourceKind = "hypercars" | "street" | "touring";

type CsvSourceFile = {
  kind: CsvSourceKind;
  filePath: string;
};

type ParsedCsvRow = {
  brand: string;
  name: string;
  modelYear: number;
  basePrice: number;
  power: number;
  topSpeed: number;
  carUrl: string | null;
  source: CsvSourceKind;
};

type SeedCountry = {
  name: string;
  code: string;
  flagUrl: string | null;
};

type SeedBrand = {
  name: string;
  countryCode: string;
  logoUrl: string | null;
};

type SeedCarModel = {
  brandName: string;
  name: string;
  modelYear: number;
  basePrice: number;
  stockQuantity: number;
  power: number;
  topSpeed: number;
  carUrl: string | null;
};

type MockPlayerTier = "VETERAN" | "REGULAR" | "NEWBIE";

type MockPlayerSeed = {
  username: string;
  tier: MockPlayerTier;
  baseMoney: number;
  skill: number;
  regDate: Date;
};

type MockModelRow = {
  id: number;
  name: string;
  modelYear: number;
  basePrice: number;
  power: number;
  topSpeed: number;
  brand: {
    name: string;
  };
};

type MockOwnedCarSeed = {
  id: number;
  playerId: number;
  modelId: number;
  brandName: string;
  modelName: string;
  basePrice: number;
  power: number;
  topSpeed: number;
  mileage: number;
};

const DEFAULT_CSV_DIR = process.env.TC2_CSV_DIR ?? "/Users/mike/Documents/tc2_crawler";
const DEFAULT_MODEL_YEAR = 2020;
const SIMPLE_ICONS_BASE_URL = "https://cdn.simpleicons.org";

const DEFAULTS_BY_SOURCE: Record<
  CsvSourceKind,
  { basePrice: number; power: number; topSpeed: number }
> = {
  hypercars: { basePrice: 1_000_000, power: 900, topSpeed: 380 },
  street: { basePrice: 100_000, power: 300, topSpeed: 250 },
  touring: { basePrice: 350_000, power: 550, topSpeed: 300 }
};

const COUNTRY_DEFINITIONS: Record<string, SeedCountry> = {
  AT: { name: "Austria", code: "AT", flagUrl: "https://flagcdn.com/w80/at.png" },
  DE: { name: "Germany", code: "DE", flagUrl: "https://flagcdn.com/w80/de.png" },
  FR: { name: "France", code: "FR", flagUrl: "https://flagcdn.com/w80/fr.png" },
  GB: { name: "United Kingdom", code: "GB", flagUrl: "https://flagcdn.com/w80/gb.png" },
  IT: { name: "Italy", code: "IT", flagUrl: "https://flagcdn.com/w80/it.png" },
  JP: { name: "Japan", code: "JP", flagUrl: "https://flagcdn.com/w80/jp.png" },
  NL: { name: "Netherlands", code: "NL", flagUrl: "https://flagcdn.com/w80/nl.png" },
  SE: { name: "Sweden", code: "SE", flagUrl: "https://flagcdn.com/w80/se.png" },
  US: { name: "United States", code: "US", flagUrl: "https://flagcdn.com/w80/us.png" },
  XX: { name: "Unknown", code: "XX", flagUrl: null }
};

const BRAND_COUNTRY_CODES: Record<string, string> = {
  Abarth: "IT",
  Acura: "JP",
  "Alfa Romeo": "IT",
  "Aston Martin": "GB",
  Audi: "DE",
  BMW: "DE",
  Bentley: "GB",
  Bugatti: "FR",
  Cadillac: "US",
  Chevrolet: "US",
  Chrysler: "US",
  Dodge: "US",
  Ducati: "IT",
  Ferrari: "IT",
  Ford: "US",
  "Harley-Davidson": "US",
  Honda: "JP",
  Hummer: "US",
  Indian: "US",
  Jaguar: "GB",
  Jeep: "US",
  KTM: "AT",
  Kawasaki: "JP",
  Koenigsegg: "SE",
  Lamborghini: "IT",
  Lotus: "GB",
  "MV Agusta": "IT",
  Maserati: "IT",
  Mazda: "JP",
  McLaren: "GB",
  "Mercedes-Benz": "DE",
  Mini: "GB",
  Mitsubishi: "JP",
  Nissan: "JP",
  Pagani: "IT",
  Peugeot: "FR",
  Porsche: "DE",
  Proto: "US",
  Renault: "FR",
  RUF: "DE",
  Saleen: "US",
  Shelby: "US",
  Spyker: "NL",
  Suzuki: "JP",
  Toyota: "JP",
  TVR: "GB",
  Volkswagen: "DE"
};

function simpleIcon(slug: string): string {
  return `${SIMPLE_ICONS_BASE_URL}/${slug}`;
}

function commonsFilePath(fileName: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function logoWineAsset(slug: string): string {
  return `https://www.logo.wine/a/logo/${slug}/${slug}-Logo.wine.svg`;
}

const GENERIC_BRAND_LOGO_URL = commonsFilePath("No-Image-Placeholder.svg");

const BRAND_LOGOS: Record<string, string> = {
  Abarth: commonsFilePath("Abarth Logo.png"),
  Acura: simpleIcon("acura"),
  "Alfa Romeo": commonsFilePath("Alfa-romeo-quadrifoglio-logo.png"),
  "Aston Martin": simpleIcon("astonmartin"),
  Audi: simpleIcon("audi"),
  BMW: simpleIcon("bmw"),
  Bentley: simpleIcon("bentley"),
  Bugatti: simpleIcon("bugatti"),
  Cadillac: simpleIcon("cadillac"),
  Chevrolet: simpleIcon("chevrolet"),
  Chrysler: simpleIcon("chrysler"),
  Dodge: commonsFilePath("Dodge logo.svg"),
  Ducati: simpleIcon("ducati"),
  Ferrari: simpleIcon("ferrari"),
  Ford: simpleIcon("ford"),
  "Harley-Davidson": commonsFilePath("Harley-Davidson logo.svg"),
  Honda: simpleIcon("honda"),
  Hummer: commonsFilePath("New Hummer logo.png"),
  Indian: commonsFilePath("Indian Motorcycle logo.svg"),
  Jaguar: commonsFilePath("Jaguar-Logo.svg"),
  Jeep: simpleIcon("jeep"),
  Kawasaki: commonsFilePath("Kawasaki Motors logo.svg"),
  Koenigsegg: simpleIcon("koenigsegg"),
  KTM: simpleIcon("ktm"),
  Lamborghini: simpleIcon("lamborghini"),
  Lotus: commonsFilePath("Lotus logo.png"),
  Maserati: simpleIcon("maserati"),
  Mazda: simpleIcon("mazda"),
  McLaren: simpleIcon("mclaren"),
  "Mercedes-Benz": commonsFilePath("Mercedes-Benz free logo.svg"),
  Mini: simpleIcon("mini"),
  Mitsubishi: simpleIcon("mitsubishi"),
  "MV Agusta": commonsFilePath("MV Agusta Logo.svg"),
  Nissan: simpleIcon("nissan"),
  Pagani: logoWineAsset("Pagani_%28company%29"),
  Peugeot: simpleIcon("peugeot"),
  Porsche: simpleIcon("porsche"),
  Proto:
    "https://static.wikia.nocookie.net/thecrew/images/8/8f/ManufacturerProto.png/revision/latest/scale-to-width-down/512?cb=20180904120251",
  Renault: simpleIcon("renault"),
  RUF: commonsFilePath("Ruf Automobile logo.svg"),
  Saleen: logoWineAsset("Saleen"),
  Shelby: "https://iconape.com/wp-content/files/wu/161021/svg/161021.svg",
  Spyker: commonsFilePath("Logo Spyker.svg"),
  Suzuki: simpleIcon("suzuki"),
  Toyota: simpleIcon("toyota"),
  TVR: commonsFilePath("TVR Logo.svg"),
  Volkswagen: simpleIcon("volkswagen")
};

const tracks = [
  {
    name: "Miami Race Track",
    length: 4.0,
    imageUrl:
      "https://preview.redd.it/jrzh0hcfkla91.jpg?width=3840&format=pjpg&auto=webp&s=04eeca2e268b16c65d4ce61b95d78932cdc0a19e"
  },
  {
    name: "Mazda Raceway Laguna Seca",
    length: 3.6,
    imageUrl:
      "https://preview.redd.it/w5gcgmoekla91.jpg?width=3840&format=pjpg&auto=webp&s=25fff160bde79bb4bd7a1ece6e54b7fa24ee9ed6"
  },
  {
    name: "Little Eagle Speedrome",
    length: 2.5,
    imageUrl:
      "https://preview.redd.it/nzo7kt5gkla91.jpg?width=3840&format=pjpg&auto=webp&s=045ee039b4c8276dc5e08ec44448ad15c3b81cc1"
  },
  {
    name: "Long Island Speedrome",
    length: 3.0,
    imageUrl:
      "https://preview.redd.it/n0pkxrugkla91.jpg?width=3840&format=pjpg&auto=webp&s=206ebed610b3b785cf32c834571f8a13dcccfb85"
  },
  {
    name: "Golden Hills Race Track",
    length: 4.5,
    imageUrl:
      "https://preview.redd.it/h74kurjxpma91.jpg?width=3840&format=pjpg&auto=webp&s=73615f73a33dc43230f836f90c5c236ea54bf861"
  },
  {
    name: "The Giants Race Track",
    length: 5.0,
    imageUrl:
      "https://preview.redd.it/6xsy5rqikla91.jpg?width=3840&format=pjpg&auto=webp&s=b6452bc29c4d96b3a00be99d92e0d79a71dc529a"
  },
  {
    name: "Jersey Racing Track",
    length: 3.8,
    imageUrl:
      "https://preview.redd.it/yw9iw3bkkla91.jpg?width=3840&format=pjpg&auto=webp&s=815f7df732ef05193bc2e17e41ea3cc3e78cbd88"
  }
];

const schedule = [
  {
    seasonYear: 2024,
    roundNumber: 1,
    trackName: "Miami Race Track",
    raceDate: new Date("2024-03-10T12:00:00.000Z")
  },
  {
    seasonYear: 2024,
    roundNumber: 2,
    trackName: "Mazda Raceway Laguna Seca",
    raceDate: new Date("2024-04-14T12:00:00.000Z")
  },
  {
    seasonYear: 2024,
    roundNumber: 3,
    trackName: "Little Eagle Speedrome",
    raceDate: new Date("2024-05-19T12:00:00.000Z")
  },
  {
    seasonYear: 2024,
    roundNumber: 4,
    trackName: "Long Island Speedrome",
    raceDate: new Date("2024-06-23T12:00:00.000Z")
  },
  {
    seasonYear: 2024,
    roundNumber: 5,
    trackName: "Golden Hills Race Track",
    raceDate: new Date("2024-08-11T12:00:00.000Z")
  },
  {
    seasonYear: 2024,
    roundNumber: 6,
    trackName: "The Giants Race Track",
    raceDate: new Date("2024-09-22T12:00:00.000Z")
  }
];

const MOCK_SEASON_YEAR = 2024;

const MOCK_PLAYERS: MockPlayerSeed[] = [
  {
    username: "apex_legend",
    tier: "VETERAN",
    baseMoney: 5_800_000,
    skill: 98,
    regDate: new Date("2021-02-14T09:00:00.000Z")
  },
  {
    username: "hypernova_gt",
    tier: "VETERAN",
    baseMoney: 5_400_000,
    skill: 96,
    regDate: new Date("2021-05-03T12:00:00.000Z")
  },
  {
    username: "midnight_v12",
    tier: "VETERAN",
    baseMoney: 6_100_000,
    skill: 97,
    regDate: new Date("2021-08-28T18:30:00.000Z")
  },
  {
    username: "silver_hawk",
    tier: "VETERAN",
    baseMoney: 5_650_000,
    skill: 95,
    regDate: new Date("2022-01-09T08:45:00.000Z")
  },
  {
    username: "track_tactician",
    tier: "VETERAN",
    baseMoney: 5_250_000,
    skill: 94,
    regDate: new Date("2022-04-16T10:15:00.000Z")
  },
  {
    username: "city_slipstream",
    tier: "REGULAR",
    baseMoney: 1_450_000,
    skill: 84,
    regDate: new Date("2022-06-12T11:30:00.000Z")
  },
  {
    username: "coastline_racer",
    tier: "REGULAR",
    baseMoney: 1_280_000,
    skill: 82,
    regDate: new Date("2022-07-20T15:00:00.000Z")
  },
  {
    username: "redline_echo",
    tier: "REGULAR",
    baseMoney: 1_120_000,
    skill: 80,
    regDate: new Date("2022-09-02T16:20:00.000Z")
  },
  {
    username: "canyon_pulse",
    tier: "REGULAR",
    baseMoney: 980_000,
    skill: 79,
    regDate: new Date("2022-10-17T13:45:00.000Z")
  },
  {
    username: "grid_nomad",
    tier: "REGULAR",
    baseMoney: 1_600_000,
    skill: 85,
    regDate: new Date("2022-11-08T09:15:00.000Z")
  },
  {
    username: "turbo_monsoon",
    tier: "REGULAR",
    baseMoney: 1_300_000,
    skill: 81,
    regDate: new Date("2023-01-04T12:40:00.000Z")
  },
  {
    username: "sunset_gear",
    tier: "REGULAR",
    baseMoney: 1_100_000,
    skill: 78,
    regDate: new Date("2023-02-21T17:05:00.000Z")
  },
  {
    username: "northern_apex",
    tier: "REGULAR",
    baseMoney: 1_050_000,
    skill: 77,
    regDate: new Date("2023-03-18T07:50:00.000Z")
  },
  {
    username: "shift_cadet",
    tier: "REGULAR",
    baseMoney: 890_000,
    skill: 75,
    regDate: new Date("2023-05-13T14:10:00.000Z")
  },
  {
    username: "velocity_jade",
    tier: "REGULAR",
    baseMoney: 1_220_000,
    skill: 83,
    regDate: new Date("2023-06-26T19:00:00.000Z")
  },
  {
    username: "starter_luke",
    tier: "NEWBIE",
    baseMoney: 100_000,
    skill: 58,
    regDate: new Date("2024-01-15T09:20:00.000Z")
  },
  {
    username: "rookie_mia",
    tier: "NEWBIE",
    baseMoney: 125_000,
    skill: 55,
    regDate: new Date("2024-02-02T11:00:00.000Z")
  },
  {
    username: "fresh_clutch",
    tier: "NEWBIE",
    baseMoney: 140_000,
    skill: 53,
    regDate: new Date("2024-02-18T16:35:00.000Z")
  },
  {
    username: "new_lane",
    tier: "NEWBIE",
    baseMoney: 110_000,
    skill: 50,
    regDate: new Date("2024-03-03T08:10:00.000Z")
  },
  {
    username: "pit_exit",
    tier: "NEWBIE",
    baseMoney: 135_000,
    skill: 52,
    regDate: new Date("2024-03-21T10:50:00.000Z")
  }
];

function resolveCsvSourceFiles(): CsvSourceFile[] {
  return [
    {
      kind: "hypercars",
      filePath:
        process.env.TC2_HYPERCARS_CSV ??
        path.join(DEFAULT_CSV_DIR, "tc2_hypercars_full.csv")
    },
    {
      kind: "street",
      filePath:
        process.env.TC2_STREET_CSV ??
        path.join(DEFAULT_CSV_DIR, "tc2_street_full.csv")
    },
    {
      kind: "touring",
      filePath:
        process.env.TC2_TOURING_CSV ??
        path.join(DEFAULT_CSV_DIR, "tc2_touring_full.csv")
    }
  ];
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

async function parseCsvFile(sourceFile: CsvSourceFile): Promise<ParsedCsvRow[]> {
  const fileContents = await fs.readFile(sourceFile.filePath, "utf8");
  const lines = fileContents
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows: ParsedCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const rawValues = parseCsvLine(line);
    const record = headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = (rawValues[index] ?? "").trim();
      return accumulator;
    }, {});

    const brand = normalizeText(record.Brand);
    const name = normalizeText(record.Name);

    if (!brand || !name) {
      continue;
    }

    rows.push({
      brand,
      name,
      modelYear: parseModelYear(record.Year),
      basePrice: parseBasePrice(record.Cost, sourceFile.kind),
      power: parsePower(record.Power, sourceFile.kind),
      topSpeed: parseTopSpeed(record.TPS, sourceFile.kind),
      carUrl: normalizeImageUrl(record.Image),
      source: sourceFile.kind
    });
  }

  return rows;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseInteger(value: string | null | undefined): number | null {
  const match = (value ?? "").replace(/,/g, "").match(/-?\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function parseModelYear(value: string | null | undefined): number {
  return parseInteger(value) ?? DEFAULT_MODEL_YEAR;
}

function parseBasePrice(value: string | null | undefined, source: CsvSourceKind): number {
  return parseInteger(value) ?? DEFAULTS_BY_SOURCE[source].basePrice;
}

function parsePower(value: string | null | undefined, source: CsvSourceKind): number {
  return parseInteger(value) ?? DEFAULTS_BY_SOURCE[source].power;
}

function parseTopSpeed(value: string | null | undefined, source: CsvSourceKind): number {
  const text = value ?? "";
  const kmhMatches = [...text.matchAll(/>?(\d+)\s*kmh/gi)];

  if (kmhMatches.length > 0) {
    const lastMatch = kmhMatches[kmhMatches.length - 1];
    return Number.parseInt(lastMatch[1], 10);
  }

  return DEFAULTS_BY_SOURCE[source].topSpeed;
}

function normalizeImageUrl(value: string | null | undefined): string | null {
  const rawValue = normalizeText(value);

  if (!rawValue) {
    return null;
  }

  if (/static\.wikia\.nocookie\.net/i.test(rawValue)) {
    return rawValue
      .replace(/\/revision\/latest\/scale-to-width-down\/\d+/i, "/revision/latest/scale-to-width-down/512")
      .replace(/\/revision\/latest(?=(\?|$))/i, "/revision/latest/scale-to-width-down/512");
  }

  return rawValue;
}

function stableHash(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash >>> 0;
}

function stableStockQuantity(seed: string): number {
  return 2 + (stableHash(seed) % 9);
}

function pickDeterministicInt(seed: string, min: number, max: number): number {
  return min + (stableHash(seed) % (max - min + 1));
}

function deterministicOrder<T>(
  items: T[],
  seed: string,
  getKey: (item: T) => string | number
): T[] {
  return [...items].sort((left, right) => {
    const leftKey = String(getKey(left));
    const rightKey = String(getKey(right));
    const diff = stableHash(`${seed}:${leftKey}`) - stableHash(`${seed}:${rightKey}`);

    if (diff !== 0) {
      return diff;
    }

    return leftKey.localeCompare(rightKey);
  });
}

function daysAgo(seed: string, maxDays: number): Date {
  const dayOffset = pickDeterministicInt(seed, 0, maxDays);
  const hourOffset = pickDeterministicInt(`hour:${seed}`, 0, 23);
  const minuteOffset = pickDeterministicInt(`minute:${seed}`, 0, 59);

  return new Date(
    Date.now() - dayOffset * 24 * 60 * 60 * 1000 - hourOffset * 60 * 60 * 1000 - minuteOffset * 60 * 1000
  );
}

function roundCurrency(value: number): number {
  return Math.max(1_000, Math.round(value / 100) * 100);
}

function getGarageCountRange(tier: MockPlayerTier): [number, number] {
  switch (tier) {
    case "VETERAN":
      return [3, 5];
    case "REGULAR":
      return [2, 4];
    case "NEWBIE":
      return [1, 2];
  }
}

function getMileageRange(tier: MockPlayerTier): [number, number] {
  switch (tier) {
    case "VETERAN":
      return [7_500, 30_000];
    case "REGULAR":
      return [2_500, 18_000];
    case "NEWBIE":
      return [150, 6_000];
  }
}

function buildModelPools(models: MockModelRow[]) {
  const sorted = [...models].sort((left, right) => left.basePrice - right.basePrice);
  const newbiePoolSize = Math.max(25, Math.ceil(sorted.length * 0.35));
  const veteranPoolSize = Math.max(25, Math.ceil(sorted.length * 0.25));
  const regularStart = Math.floor(sorted.length * 0.2);
  const regularEnd = Math.max(regularStart + 1, Math.floor(sorted.length * 0.85));

  return {
    newbie: sorted.slice(0, newbiePoolSize),
    regular: sorted.slice(regularStart, regularEnd),
    veteran: sorted.slice(Math.max(0, sorted.length - veteranPoolSize))
  };
}

function selectGarageModels(
  pool: MockModelRow[],
  fallbackPool: MockModelRow[],
  count: number,
  seed: string
) {
  const primary = deterministicOrder(pool, seed, (model) => model.id).slice(
    0,
    Math.min(count, pool.length)
  );

  if (primary.length >= count) {
    return primary;
  }

  const selectedIds = new Set(primary.map((model) => model.id));
  const supplemental = deterministicOrder(
    fallbackPool.filter((model) => !selectedIds.has(model.id)),
    `${seed}:fallback`,
    (model) => model.id
  ).slice(0, count - primary.length);

  return [...primary, ...supplemental];
}

function pickPreferredRow(existing: ParsedCsvRow, incoming: ParsedCsvRow): ParsedCsvRow {
  const existingScore =
    existing.power * 1_000 + existing.topSpeed * 100 + existing.basePrice;
  const incomingScore =
    incoming.power * 1_000 + incoming.topSpeed * 100 + incoming.basePrice;

  return incomingScore > existingScore ? incoming : existing;
}

function buildVehicleSeedData(parsedRows: ParsedCsvRow[]): {
  countries: SeedCountry[];
  brands: SeedBrand[];
  carModels: SeedCarModel[];
} {
  const mergedModels = new Map<string, ParsedCsvRow>();

  for (const row of parsedRows) {
    const uniqueKey = `${row.brand}::${row.name}::${row.modelYear}`;
    const existing = mergedModels.get(uniqueKey);

    if (!existing) {
      mergedModels.set(uniqueKey, row);
      continue;
    }

    const preferredRow = pickPreferredRow(existing, row);
    mergedModels.set(uniqueKey, {
      ...preferredRow,
      basePrice: Math.max(existing.basePrice, row.basePrice),
      power: Math.max(existing.power, row.power),
      topSpeed: Math.max(existing.topSpeed, row.topSpeed),
      carUrl: preferredRow.carUrl ?? existing.carUrl ?? row.carUrl
    });
  }

  const brandNames = [...new Set(parsedRows.map((row) => row.brand))].sort((left, right) =>
    left.localeCompare(right)
  );

  const missingBrandCountries = brandNames.filter(
    (brandName) => !BRAND_COUNTRY_CODES[brandName]
  );

  if (missingBrandCountries.length > 0) {
    console.warn(
      `No country mapping defined for: ${missingBrandCountries.join(", ")}. Falling back to XX.`
    );
  }

  const brands: SeedBrand[] = brandNames.map((brandName) => {
    const countryCode = BRAND_COUNTRY_CODES[brandName] ?? "XX";

    return {
      name: brandName,
      countryCode,
      logoUrl: BRAND_LOGOS[brandName] ?? GENERIC_BRAND_LOGO_URL
    };
  });

  const countryCodes = [...new Set(brands.map((brand) => brand.countryCode))].sort();
  const countries = countryCodes.map((countryCode) => {
    const country = COUNTRY_DEFINITIONS[countryCode];

    if (!country) {
      throw new Error(`Missing country definition for code "${countryCode}".`);
    }

    return country;
  });

  const carModels: SeedCarModel[] = [...mergedModels.values()]
    .map((row) => ({
      brandName: row.brand,
      name: row.name,
      modelYear: row.modelYear,
      basePrice: row.basePrice,
      stockQuantity: stableStockQuantity(`${row.brand}:${row.name}:${row.modelYear}`),
      power: row.power,
      topSpeed: row.topSpeed,
      carUrl: row.carUrl
    }))
    .sort((left, right) => {
      const brandCompare = left.brandName.localeCompare(right.brandName);
      if (brandCompare !== 0) {
        return brandCompare;
      }

      const nameCompare = left.name.localeCompare(right.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return left.modelYear - right.modelYear;
    });

  return { countries, brands, carModels };
}

async function loadVehicleSeedData() {
  const sourceFiles = resolveCsvSourceFiles();

  for (const sourceFile of sourceFiles) {
    await fs.access(sourceFile.filePath);
  }

  const parsedRows = (await Promise.all(sourceFiles.map((sourceFile) => parseCsvFile(sourceFile))))
    .flat()
    .filter((row) => row.brand && row.name);

  if (parsedRows.length === 0) {
    throw new Error("No vehicle rows were parsed from the TC2 CSV files.");
  }

  const seedData = buildVehicleSeedData(parsedRows);

  console.info(
    `Loaded ${parsedRows.length} CSV rows into ${seedData.carModels.length} unique car models across ${seedData.brands.length} brands.`
  );

  return seedData;
}

async function seedReferenceData() {
  const { countries, brands, carModels } = await loadVehicleSeedData();

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country
    });
  }

  for (const brand of brands) {
    const country = await prisma.country.findUniqueOrThrow({
      where: { code: brand.countryCode }
    });

    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {
        logoUrl: brand.logoUrl,
        countryId: country.id
      },
      create: {
        name: brand.name,
        logoUrl: brand.logoUrl,
        countryId: country.id
      }
    });
  }

  for (const model of carModels) {
    const brand = await prisma.brand.findUniqueOrThrow({
      where: { name: model.brandName }
    });

    await prisma.carModel.upsert({
      where: {
        brandId_name_modelYear: {
          brandId: brand.id,
          name: model.name,
          modelYear: model.modelYear
        }
      },
      update: {
        basePrice: model.basePrice,
        stockQuantity: model.stockQuantity,
        power: model.power,
        topSpeed: model.topSpeed,
        carUrl: model.carUrl
      },
      create: {
        name: model.name,
        modelYear: model.modelYear,
        basePrice: model.basePrice,
        stockQuantity: model.stockQuantity,
        power: model.power,
        topSpeed: model.topSpeed,
        carUrl: model.carUrl,
        brandId: brand.id
      }
    });
  }

  for (const track of tracks) {
    await prisma.track.upsert({
      where: { name: track.name },
      update: track,
      create: track
    });
  }

  for (const round of schedule) {
    const track = await prisma.track.findUniqueOrThrow({
      where: { name: round.trackName }
    });

    await prisma.raceSchedule.upsert({
      where: {
        seasonYear_roundNumber: {
          seasonYear: round.seasonYear,
          roundNumber: round.roundNumber
        }
      },
      update: {
        trackId: track.id,
        raceDate: round.raceDate,
        status: "PENDING",
        completedAt: null,
        top1PlayerId: null,
        top1Name: null,
        top2PlayerId: null,
        top2Name: null,
        top3PlayerId: null,
        top3Name: null
      },
      create: {
        seasonYear: round.seasonYear,
        roundNumber: round.roundNumber,
        trackId: track.id,
        raceDate: round.raceDate
      }
    });
  }
}

async function seedOptionalDemoPlayers() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminPlayer = {
    username: "admin",
    money: 50_000_000,
    isAdmin: true,
    regDate: new Date("2020-01-01T00:00:00.000Z")
  };
  const demoPlayers = [
    { username: "demo_driver", money: 1_000_000 },
    { username: "silver_arrow", money: 1_000_000 },
    { username: "apex_hunter", money: 1_000_000 }
  ];

  await prisma.player.upsert({
    where: { username: adminPlayer.username },
    update: {
      passwordHash,
      money: adminPlayer.money,
      isAdmin: true,
      regDate: adminPlayer.regDate,
      accountStatus: "ACTIVE",
      deletedAt: null
    },
    create: {
      username: adminPlayer.username,
      passwordHash,
      money: adminPlayer.money,
      isAdmin: true,
      regDate: adminPlayer.regDate,
      accountStatus: "ACTIVE",
      deletedAt: null
    }
  });

  for (const player of demoPlayers) {
    await prisma.player.upsert({
      where: { username: player.username },
      update: {
        isAdmin: false
      },
      create: {
        username: player.username,
        passwordHash,
        money: player.money,
        isAdmin: false
      }
    });
  }
}

async function seedMockEcosystem() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const mockUsernames = MOCK_PLAYERS.map((player) => player.username);

  await prisma.$transaction(async (tx) => {
    for (const player of MOCK_PLAYERS) {
      await tx.player.upsert({
        where: { username: player.username },
        update: {
          passwordHash,
          money: player.baseMoney,
          isAdmin: false,
          regDate: player.regDate,
          accountStatus: "ACTIVE",
          deletedAt: null
        },
        create: {
          username: player.username,
          passwordHash,
          money: player.baseMoney,
          isAdmin: false,
          regDate: player.regDate,
          accountStatus: "ACTIVE",
          deletedAt: null
        }
      });
    }

    const mockPlayers = await tx.player.findMany({
      where: {
        username: {
          in: mockUsernames
        }
      },
      orderBy: {
        username: "asc"
      }
    });

    const playerByUsername = new Map(mockPlayers.map((player) => [player.username, player]));
    const mockPlayerSeedByUsername = new Map(
      MOCK_PLAYERS.map((player) => [player.username, player])
    );
    const playerIds = mockPlayers.map((player) => player.id);

    const seasonSchedules = await tx.raceSchedule.findMany({
      where: {
        seasonYear: MOCK_SEASON_YEAR
      },
      include: {
        track: true
      },
      orderBy: {
        roundNumber: "asc"
      }
    });

    if (seasonSchedules.length === 0) {
      throw new Error(`No race schedules were found for season ${MOCK_SEASON_YEAR}.`);
    }

    const completedScheduleCount =
      seasonSchedules.length > 1 ? Math.max(1, seasonSchedules.length - 2) : 0;
    const completedSchedules = seasonSchedules.slice(0, completedScheduleCount);

    const scheduleIds = seasonSchedules.map((scheduleRow) => scheduleRow.id);

    await tx.raceResult.deleteMany({
      where: {
        OR: [
          {
            raceScheduleId: {
              in: scheduleIds
            }
          },
          {
            playerId: {
              in: playerIds
            }
          }
        ]
      }
    });

    await tx.seasonPoints.deleteMany({
      where: {
        seasonYear: MOCK_SEASON_YEAR
      }
    });

    await tx.raceSchedule.updateMany({
      where: {
        seasonYear: MOCK_SEASON_YEAR
      },
      data: {
        status: "PENDING",
        completedAt: null,
        top1PlayerId: null,
        top1Name: null,
        top2PlayerId: null,
        top2Name: null,
        top3PlayerId: null,
        top3Name: null
      }
    });

    await tx.moneyTransaction.deleteMany({
      where: {
        playerId: {
          in: playerIds
        }
      }
    });

    await tx.ownedCar.deleteMany({
      where: {
        playerId: {
          in: playerIds
        }
      }
    });

    const carModels = await tx.carModel.findMany({
      include: {
        brand: true
      },
      orderBy: {
        basePrice: "asc"
      }
    });

    if (carModels.length === 0) {
      throw new Error("No car models are available to populate the mock ecosystem.");
    }

    const pools = buildModelPools(carModels);
    const garageByPlayerId = new Map<number, MockOwnedCarSeed[]>();

    for (const playerSeed of MOCK_PLAYERS) {
      const player = playerByUsername.get(playerSeed.username);

      if (!player) {
        throw new Error(`Mock player ${playerSeed.username} was not created correctly.`);
      }

      const [minCars, maxCars] = getGarageCountRange(playerSeed.tier);
      const [minMileage, maxMileage] = getMileageRange(playerSeed.tier);
      const garageCount = pickDeterministicInt(
        `garage-count:${playerSeed.username}`,
        minCars,
        maxCars
      );
      const preferredPool =
        playerSeed.tier === "VETERAN"
          ? pools.veteran
          : playerSeed.tier === "REGULAR"
            ? pools.regular
            : pools.newbie;
      const selectedModels = selectGarageModels(
        preferredPool,
        carModels,
        garageCount,
        `garage:${playerSeed.username}`
      );
      const ownedCars: MockOwnedCarSeed[] = [];

      for (const model of selectedModels) {
        const maxDaysSinceRegistration = Math.max(
          0,
          Math.floor((Date.now() - playerSeed.regDate.getTime()) / (24 * 60 * 60 * 1000))
        );
        const obtainOffset = pickDeterministicInt(
          `obtain:${playerSeed.username}:${model.id}`,
          0,
          Math.max(1, maxDaysSinceRegistration)
        );
        const obtainDate = new Date(
          Date.now() - obtainOffset * 24 * 60 * 60 * 1000 - pickDeterministicInt(`obtain-hour:${playerSeed.username}:${model.id}`, 0, 23) * 60 * 60 * 1000
        );
        const mileage = pickDeterministicInt(
          `mileage:${playerSeed.username}:${model.id}`,
          minMileage,
          maxMileage
        );

        const ownedCar = await tx.ownedCar.create({
          data: {
            playerId: player.id,
            modelId: model.id,
            mileage,
            obtainDate
          }
        });

        ownedCars.push({
          id: ownedCar.id,
          playerId: player.id,
          modelId: model.id,
          brandName: model.brand.name,
          modelName: model.name,
          basePrice: model.basePrice,
          power: model.power,
          topSpeed: model.topSpeed,
          mileage
        });
      }

      garageByPlayerId.set(player.id, ownedCars);

      await tx.moneyTransaction.create({
        data: {
          playerId: player.id,
          type: "ADMIN_ADJUSTMENT",
          amount: playerSeed.baseMoney,
          description: `Mock ecosystem bankroll allocation for ${playerSeed.tier.toLowerCase()} player`,
          transTime: playerSeed.regDate
        }
      });
    }

    const primaryCarByPlayerId = new Map<number, MockOwnedCarSeed>();

    for (const player of mockPlayers) {
      const ownedCars = garageByPlayerId.get(player.id) ?? [];

      const primaryCar = [...ownedCars].sort((left, right) => {
        if (right.topSpeed !== left.topSpeed) {
          return right.topSpeed - left.topSpeed;
        }

        if (right.power !== left.power) {
          return right.power - left.power;
        }

        if (left.mileage !== right.mileage) {
          return left.mileage - right.mileage;
        }

        return right.basePrice - left.basePrice;
      })[0];

      if (!primaryCar) {
        throw new Error(`Player ${player.username} has no primary car for mock races.`);
      }

      primaryCarByPlayerId.set(player.id, primaryCar);
    }

    const listingCandidates = mockPlayers.flatMap((player) => {
      const primaryCar = primaryCarByPlayerId.get(player.id);
      return (garageByPlayerId.get(player.id) ?? []).filter((car) => car.id !== primaryCar?.id);
    });
    const totalOwnedCars = [...garageByPlayerId.values()].reduce(
      (total, ownedCars) => total + ownedCars.length,
      0
    );
    const listingTarget = Math.min(
      listingCandidates.length,
      Math.max(1, Math.round(totalOwnedCars * 0.3))
    );
    const selectedListings = deterministicOrder(
      listingCandidates,
      "mock-market-listings",
      (car) => car.id
    ).slice(0, listingTarget);

    for (const listing of selectedListings) {
      const salePrice = roundCurrency(
        listing.basePrice *
          (pickDeterministicInt(`listing-price:${listing.id}`, 80, 120) / 100)
      );
      const listingDate = daysAgo(`listing-date:${listing.id}`, 35);

      await tx.ownedCar.update({
        where: {
          id: listing.id
        },
        data: {
          onSale: true,
          salePrice,
          listingDate
        }
      });

      await tx.moneyTransaction.create({
        data: {
          playerId: listing.playerId,
          type: "LISTING_CREATED",
          amount: 0,
          description: `Listed ${listing.brandName} ${listing.modelName} for $${salePrice.toLocaleString()}`,
          transTime: listingDate
        }
      });
    }

    const seasonPointsByPlayerId = new Map<
      number,
      {
        seasonYear: number;
        playerId: number;
        totalPoints: number;
        winCount: number;
        podiumCount: number;
        raceCount: number;
      }
    >();
    const prizeMoneyByPlayerId = new Map<number, number>();
    const totalRaceMileageGain = completedSchedules.reduce(
      (total, scheduleRow) =>
        total + Math.ceil(scheduleRow.track.length * gameRules.distanceMultiplier),
      0
    );

    for (const scheduleRow of completedSchedules) {
      const entrants = mockPlayers.map((player) => {
        const playerSeed = mockPlayerSeedByUsername.get(player.username);
        const primaryCar = primaryCarByPlayerId.get(player.id);

        if (!playerSeed || !primaryCar) {
          throw new Error(`Missing mock player race data for ${player.username}.`);
        }

        const baseTrackTimeMs = Math.round(120_000 + scheduleRow.track.length * 85_000);
        const carScore = primaryCar.topSpeed * 0.62 + primaryCar.power * 0.38;
        const carPenaltyMs = Math.round((700 - carScore) * 260);
        const skillPenaltyMs = (100 - playerSeed.skill) * 2_400;
        const mileagePenaltyMs = Math.round(primaryCar.mileage * 1.35);
        const tierPenaltyMs =
          playerSeed.tier === "VETERAN" ? -12_000 : playerSeed.tier === "REGULAR" ? 0 : 22_000;
        const varianceMs = pickDeterministicInt(
          `finish-variance:${scheduleRow.id}:${player.id}`,
          -4_000,
          8_000
        );

        return {
          playerId: player.id,
          username: player.username,
          ownedCarId: primaryCar.id,
          finishTimeMs: Math.max(
            180_000,
            baseTrackTimeMs +
              carPenaltyMs +
              skillPenaltyMs +
              mileagePenaltyMs +
              tierPenaltyMs +
              varianceMs
          ),
          power: primaryCar.power,
          topSpeed: primaryCar.topSpeed,
          mileage: primaryCar.mileage
        };
      });

      const rankedEntrants = [...entrants]
        .sort((left, right) => {
          if (left.finishTimeMs !== right.finishTimeMs) {
            return left.finishTimeMs - right.finishTimeMs;
          }

          if (right.power !== left.power) {
            return right.power - left.power;
          }

          if (right.topSpeed !== left.topSpeed) {
            return right.topSpeed - left.topSpeed;
          }

          if (left.mileage !== right.mileage) {
            return left.mileage - right.mileage;
          }

          return left.playerId - right.playerId;
        })
        .map((entrant, index) => {
          const finishRank = index + 1;
          return {
            ...entrant,
            finishRank,
            pointsAwarded: gameRules.pointsTable[index] ?? 0,
            prizeMoney: gameRules.prizeMoneyTable[index] ?? 0,
            createdAt: new Date(scheduleRow.raceDate.getTime() + finishRank * 60_000)
          };
        });

      await tx.raceResult.createMany({
        data: rankedEntrants.map((result) => ({
          raceScheduleId: scheduleRow.id,
          playerId: result.playerId,
          ownedCarId: result.ownedCarId,
          finishRank: result.finishRank,
          finishTimeMs: result.finishTimeMs,
          pointsAwarded: result.pointsAwarded,
          prizeMoney: result.prizeMoney,
          createdAt: result.createdAt
        }))
      });

      for (const result of rankedEntrants) {
        const standing = seasonPointsByPlayerId.get(result.playerId) ?? {
          seasonYear: MOCK_SEASON_YEAR,
          playerId: result.playerId,
          totalPoints: 0,
          winCount: 0,
          podiumCount: 0,
          raceCount: 0
        };

        standing.totalPoints += result.pointsAwarded;
        standing.raceCount += 1;
        if (result.finishRank === 1) standing.winCount += 1;
        if (result.finishRank <= 3) standing.podiumCount += 1;

        seasonPointsByPlayerId.set(result.playerId, standing);
        prizeMoneyByPlayerId.set(
          result.playerId,
          (prizeMoneyByPlayerId.get(result.playerId) ?? 0) + result.prizeMoney
        );

        if (result.prizeMoney > 0) {
          await tx.moneyTransaction.create({
            data: {
              playerId: result.playerId,
              type: "RACE_PRIZE",
              amount: result.prizeMoney,
              description: `Race prize for ${scheduleRow.track.name} round ${scheduleRow.roundNumber}`,
              transTime: new Date(scheduleRow.raceDate.getTime() + 2 * 60 * 60 * 1000)
            }
          });
        }
      }

      await tx.raceSchedule.update({
        where: {
          id: scheduleRow.id
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(scheduleRow.raceDate.getTime() + 2 * 60 * 60 * 1000),
          top1PlayerId: rankedEntrants[0]?.playerId ?? null,
          top1Name: rankedEntrants[0]?.username ?? null,
          top2PlayerId: rankedEntrants[1]?.playerId ?? null,
          top2Name: rankedEntrants[1]?.username ?? null,
          top3PlayerId: rankedEntrants[2]?.playerId ?? null,
          top3Name: rankedEntrants[2]?.username ?? null
        }
      });
    }

    await tx.seasonPoints.createMany({
      data: [...seasonPointsByPlayerId.values()]
    });

    for (const playerSeed of MOCK_PLAYERS) {
      const player = playerByUsername.get(playerSeed.username);
      const primaryCar = player ? primaryCarByPlayerId.get(player.id) : null;

      if (!player || !primaryCar) {
        throw new Error(`Failed to finalize mock ecosystem for ${playerSeed.username}.`);
      }

      await tx.player.update({
        where: {
          id: player.id
        },
        data: {
          money: playerSeed.baseMoney + (prizeMoneyByPlayerId.get(player.id) ?? 0)
        }
      });

      await tx.ownedCar.update({
        where: {
          id: primaryCar.id
        },
        data: {
          mileage: {
            increment: totalRaceMileageGain
          }
        }
      });
    }
  });
}

async function main() {
  await seedReferenceData();
  await seedOptionalDemoPlayers();
  await seedMockEcosystem();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
