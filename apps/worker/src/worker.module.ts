import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StorageModule } from "../../core-api/src/common/storage/storage.module.js";
import { validateEnv } from "../../core-api/src/config/env.js";
import { buildDataSourceOptions } from "../../core-api/src/database/data-source.options.js";
import { PacksModule } from "../../core-api/src/modules/packs/packs.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env", "../../.env"],
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
    PacksModule,
  ],
})
export class WorkerModule {}
