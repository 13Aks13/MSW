import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { ImportReport, PackDependency, PackDto, Paginated } from "@mc/shared";
import {
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { StorageService } from "../../common/storage/storage.service.js";
import type { BundleQueryDto, ImportQueryDto } from "./dto/import-bundle.dto.js";
import type { ListPacksQueryDto } from "./dto/list-packs.dto.js";
import { PacksService } from "./packs.service.js";
import { PackImportService } from "./services/pack-import.service.js";
import { buildUploadOptions } from "./upload.config.js";

@ApiTags("packs")
@ApiBearerAuth()
@Controller("packs")
export class PacksController {
  constructor(
    @Inject(PacksService) private readonly packs: PacksService,
    @Inject(PackImportService) private readonly importer: PackImportService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List imported resource/behavior packs" })
  list(@Query() query: ListPacksQueryDto): Promise<Paginated<PackDto>> {
    return this.packs.list(query);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string): Promise<PackDto> {
    return this.packs.get(id).then((pack) => this.packs.toDto(pack));
  }

  @Get(":id/dependencies")
  dependencies(@Param("id", ParseUUIDPipe) id: string): Promise<PackDependency[]> {
    return this.packs.findDependencies(id);
  }

  @Public()
  @Get(":id/icon")
  async icon(@Param("id", ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const pack = await this.packs.get(id);
    if (!pack.iconPath) throw new NotFoundException("This pack has no icon");
    const iconPath = path.join(this.storage.root, pack.iconPath);
    try {
      await stat(iconPath);
    } catch {
      throw new NotFoundException("Icon file is missing");
    }
    const extension = path.extname(iconPath).toLowerCase();
    const mime =
      extension === ".png" ? "image/png" : extension === ".gif" ? "image/gif" : "image/jpeg";
    return new StreamableFile(createReadStream(iconPath), {
      type: mime,
      disposition: `inline; filename="${path.basename(iconPath)}"`,
    });
  }

  @Post("import")
  @Roles("admin", "moderator")
  @UseInterceptors(FileInterceptor("file", buildUploadOptions()))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Import a ZIP bundle and auto-register every pack inside" })
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: ImportQueryDto,
  ): Promise<ImportReport> {
    return this.importer.importBundle(file, query.type, query.onDuplicate ?? "replace");
  }

  @Post("upload/resource-bundle")
  @Roles("admin", "moderator")
  @UseInterceptors(FileInterceptor("file", buildUploadOptions()))
  @ApiConsumes("multipart/form-data")
  resourceBundle(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: BundleQueryDto,
  ): Promise<ImportReport> {
    return this.importer.importBundle(file, "resource", query.onDuplicate ?? "replace");
  }

  @Post("upload/behavior-bundle")
  @Roles("admin", "moderator")
  @UseInterceptors(FileInterceptor("file", buildUploadOptions()))
  @ApiConsumes("multipart/form-data")
  behaviorBundle(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: BundleQueryDto,
  ): Promise<ImportReport> {
    return this.importer.importBundle(file, "behavior", query.onDuplicate ?? "replace");
  }

  @Delete(":id")
  @Roles("admin", "moderator")
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<{ deleted: true }> {
    await this.packs.remove(id);
    return { deleted: true };
  }
}
