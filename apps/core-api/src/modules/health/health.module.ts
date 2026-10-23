import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ServerModule } from '../server/server.module.js';

@Module({
  imports: [ServerModule],
  controllers: [HealthController],
})
export class HealthModule {}
