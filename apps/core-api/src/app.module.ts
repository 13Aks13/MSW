import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module.js';
import { BackupsModule } from './modules/backups/backups.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PacksModule } from './modules/packs/packs.module.js';
import { ServerModule } from './modules/server/server.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WorldsModule } from './modules/worlds/worlds.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { validateEnv } from './config/env.js';
import { StorageModule } from './common/storage/storage.module.js';
import { buildDataSourceOptions } from './database/data-source.options.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions((key) => config.get<string>(key)),
        autoLoadEntities: true,
      }),
    }),
    StorageModule,
    AuthModule,
    UsersModule,
    PacksModule,
    WorldsModule,
    BackupsModule,
    ServerModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
