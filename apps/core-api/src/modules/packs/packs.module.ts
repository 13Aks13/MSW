import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorldPackEntity } from "../worlds/entities/world-pack.entity.js";
import { PackEntity } from "./entities/pack.entity.js";
import { PacksController } from "./packs.controller.js";
import { PacksService } from "./packs.service.js";
import { ManifestService } from "./services/manifest.service.js";
import { PackImportService } from "./services/pack-import.service.js";
import { ZipExtractorService } from "./services/zip-extractor.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([PackEntity, WorldPackEntity])],
  controllers: [PacksController],
  providers: [PacksService, PackImportService, ManifestService, ZipExtractorService],
  exports: [PacksService, TypeOrmModule],
})
export class PacksModule {}
