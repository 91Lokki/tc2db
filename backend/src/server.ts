import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`TC2DB backend listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error("Failed to start TC2DB backend", error);
  process.exit(1);
});
