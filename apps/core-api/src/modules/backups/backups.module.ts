import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServerModule } from "../server/server.module.js";
import { WorldEntity } from "../worlds/entities/world.entity.js";
import { WorldsModule } from "../worlds/worlds.module.js";
import { BackupsController } from "./backups.controller.js";
import { BackupsService } from "./backups.service.js";
import { BackupEntity } from "./entities/backup.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([BackupEntity, WorldEntity]), ServerModule, WorldsModule],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService],
})
export class BackupsModule {}
