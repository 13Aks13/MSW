import { Module } from "@nestjs/common";
import { ServerModule } from "../server/server.module.js";
import { SettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";

@Module({
  imports: [ServerModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
