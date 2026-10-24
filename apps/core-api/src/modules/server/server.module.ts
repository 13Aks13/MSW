import { Module } from "@nestjs/common";
import { AllowlistService } from "./allowlist.service.js";
import { DockerService } from "./docker.service.js";
import { LogsGateway } from "./logs.gateway.js";
import { ServerController } from "./server.controller.js";
import { ServerService } from "./server.service.js";

@Module({
  controllers: [ServerController],
  providers: [DockerService, ServerService, LogsGateway, AllowlistService],
  exports: [DockerService, ServerService, AllowlistService],
})
export class ServerModule {}
