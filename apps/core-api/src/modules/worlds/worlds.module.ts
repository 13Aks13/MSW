import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldEntity } from './entities/world.entity.js';
import { WorldPackEntity } from './entities/world-pack.entity.js';
import { PackEntity } from '../packs/entities/pack.entity.js';
import { WorldsController } from './worlds.controller.js';
import { WorldsService } from './worlds.service.js';
import { ServerModule } from '../server/server.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([WorldEntity, WorldPackEntity, PackEntity]), ServerModule],
  controllers: [WorldsController],
  providers: [WorldsService],
  exports: [WorldsService],
})
export class WorldsModule {}
