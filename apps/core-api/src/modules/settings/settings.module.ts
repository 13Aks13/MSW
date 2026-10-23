import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { ServerModule } from '../server/server.module.js';

@Module({
  imports: [ServerModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
