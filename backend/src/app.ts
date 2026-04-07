import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { healthRouter } from "./modules/health/health.routes";
import { playersRouter } from "./modules/players/players.routes";
import { marketRouter } from "./modules/market/market.routes";
import { raceRouter } from "./modules/race/race.routes";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.routes";
import { trackRouter } from "./modules/track/track.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use(healthRouter);

  app.use("/api/Players", playersRouter);
  app.use("/api/Market", marketRouter);
  app.use("/api/Race", raceRouter);
  app.use("/api/Leaderboard", leaderboardRouter);
  app.use("/api/Track", trackRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
