import { Module } from "@nestjs/common";
import { DockerService } from "./docker.service.js";
import { LogsGateway } from "./logs.gateway.js";
import { ServerController } from "./server.controller.js";
import { ServerService } from "./server.service.js";

@Module({
  controllers: [ServerController],
  providers: [DockerService, ServerService, LogsGateway],
  exports: [DockerService, ServerService],
})
export class ServerModule {}
