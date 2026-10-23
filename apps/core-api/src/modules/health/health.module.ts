import { Module } from "@nestjs/common";
import { ServerModule } from "../server/server.module.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [ServerModule],
  controllers: [HealthController],
})
export class HealthModule {}
