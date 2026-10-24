import "reflect-metadata";

process.env.RUN_WORKER = process.env.RUN_WORKER ?? "true";

import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module.js";

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule, { logger: ["log", "error", "warn"] });
  await app.init();
  // Keep process alive for BullMQ worker.
  process.on("SIGTERM", async () => {
    await app.close();
    process.exit(0);
  });
}

void bootstrap();
