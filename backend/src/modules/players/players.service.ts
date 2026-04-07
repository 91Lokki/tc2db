import { AppError } from "../../shared/errors/app-error";
import { rankStandings } from "../leaderboard/leaderboard.utils";
import {
  findPlayerProfileBase,
  getAllSeasonPointRows,
  getGarageRows,
  getLatestSeasonYear,
  getRaceResultRows,
  getRecentRaceRows,
  getSeasonPointRowsForPlayer,
  getTransactionRows
} from "./players.repository";

type BuildProfileOptions = {
  username: string;
  includePrivate: boolean;
  requesterPlayerId?: number;
};

function mapGarage(rows: Awaited<ReturnType<typeof getGarageRows>>) {
  return rows.map((row) => ({
    carId: row.id,
    modelName: row.model.name,
    brandName: row.model.brand.name,
    modelYear: row.model.modelYear,
    onSale: row.onSale,
    salePrice: row.salePrice,
    obtainDate: row.obtainDate,
    mileage: row.mileage,
    listingDate: row.listingDate,
    carUrl: row.model.carUrl,
    countryName: row.model.brand.country.name,
    countryFlagUrl: row.model.brand.country.flagUrl
  }));
}

function mapTransactions(rows: Awaited<ReturnType<typeof getTransactionRows>>) {
  return rows.map((row) => ({
    transTime: row.transTime,
    type: row.type,
    description: row.description,
    amount: row.amount,
    counterpartyName: row.counterpartyName
  }));
}

function mapRecentRaces(rows: Awaited<ReturnType<typeof getRecentRaceRows>>) {
  return rows.map((row) => ({
    trackName: row.raceSchedule.track.name,
    finishTime: row.finishTimeMs,
    seasonYear: row.raceSchedule.seasonYear,
    round: row.raceSchedule.roundNumber
  }));
}

export async function buildPlayerProfile(options: BuildProfileOptions) {
  const player = await findPlayerProfileBase(options.username);
  if (!player || player.accountStatus !== "ACTIVE" || player.deletedAt) {
    throw new AppError(404, "Player not found", "PLAYER_NOT_FOUND");
  }

  const wantsPrivateData = options.includePrivate;
  const allowPrivateData = wantsPrivateData && options.requesterPlayerId === player.id;

  if (wantsPrivateData && !allowPrivateData) {
    throw new AppError(403, "Private profile access denied", "PRIVATE_PROFILE_FORBIDDEN");
  }

  const [raceResults, recentRaces, seasonPoints, allSeasonPoints] = await Promise.all([
    getRaceResultRows(player.id),
    getRecentRaceRows(player.id),
    getSeasonPointRowsForPlayer(player.id),
    getAllSeasonPointRows()
  ]);

  const careerTotalPoints = seasonPoints.reduce((sum, row) => sum + row.totalPoints, 0);
  const totalRaceCount = raceResults.length;
  const totalWins = raceResults.filter((row) => row.finishRank === 1).length;
  const totalPodiums = raceResults.filter((row) => row.finishRank <= 3).length;

  let career1st = 0;
  let career2nd = 0;
  let career3rd = 0;

  type SeasonPointRows = typeof allSeasonPoints;
  const seasonGroups = new Map<number, SeasonPointRows>();
  for (const row of allSeasonPoints) {
    const existing = seasonGroups.get(row.seasonYear) ?? ([] as SeasonPointRows);
    existing.push(row);
    seasonGroups.set(row.seasonYear, existing);
  }

  for (const [, rows] of seasonGroups) {
    const ranked = rankStandings(
      rows.map((row) => ({
        playerId: row.playerId,
        username: row.player.username,
        totalPoints: row.totalPoints,
        winCount: row.winCount,
        podiumCount: row.podiumCount,
        raceCount: row.raceCount
      }))
    );

    const podiumEntry = ranked.find((row) => row.playerId === player.id);
    if (!podiumEntry) continue;
    if (podiumEntry.rank === 1) career1st += 1;
    if (podiumEntry.rank === 2) career2nd += 1;
    if (podiumEntry.rank === 3) career3rd += 1;
  }

  let currentRank: number | string = "-";
  const latestSeasonYear = await getLatestSeasonYear();
  if (latestSeasonYear !== null) {
    const latestRows = seasonGroups.get(latestSeasonYear) ?? ([] as SeasonPointRows);
    const rankedLatest = rankStandings(
      latestRows.map((row) => ({
        playerId: row.playerId,
        username: row.player.username,
        totalPoints: row.totalPoints,
        winCount: row.winCount,
        podiumCount: row.podiumCount,
        raceCount: row.raceCount
      }))
    );

    currentRank = rankedLatest.find((row) => row.playerId === player.id)?.rank ?? "-";
  }

  const response: Record<string, unknown> = {
    username: player.username,
    regDate: player.regDate,
    currentRank,
    careerTotalPoints,
    totalRaceCount,
    totalWins,
    totalPodiums,
    career1st,
    career2nd,
    career3rd,
    recentRaces: mapRecentRaces(recentRaces)
  };

  if (allowPrivateData) {
    const [garageRows, transactionRows] = await Promise.all([
      getGarageRows(player.id),
      getTransactionRows(player.id)
    ]);

    response.isAdmin = player.isAdmin;
    response.money = player.money;
    response.garage = mapGarage(garageRows);
    response.transactions = mapTransactions(transactionRows);
  }

  return response;
}

export async function getGarageForPlayer(playerId: number) {
  const garageRows = await getGarageRows(playerId);
  return mapGarage(garageRows);
}
