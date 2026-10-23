import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupEntity } from './entities/backup.entity.js';
import { WorldEntity } from '../worlds/entities/world.entity.js';
import { BackupsController } from './backups.controller.js';
import { BackupsService } from './backups.service.js';
import { ServerModule } from '../server/server.module.js';
import { WorldsModule } from '../worlds/worlds.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BackupEntity, WorldEntity]),
    ServerModule,
    WorldsModule,
  ],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService],
})
export class BackupsModule {}
