import { randomUUID } from "node:crypto";
import { copyFile, cp, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import {
  type DuplicatePolicy,
  type ImportIssue,
  type ImportReport,
  type PackDto,
  type PackType,
  slugify,
} from "@mc/shared";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import type { StorageService } from "../../../common/storage/storage.service.js";
import { dirSize } from "../../../common/utils/fs.utils.js";
import { PackEntity } from "../entities/pack.entity.js";
import type { PacksService } from "../packs.service.js";
import type { ManifestService } from "./manifest.service.js";
import type { ZipExtractorService } from "./zip-extractor.service.js";

@Injectable()
export class PackImportService {
  private readonly logger = new Logger(PackImportService.name);

  constructor(
    @InjectRepository(PackEntity)
    private readonly packs: Repository<PackEntity>,
    private readonly packsService: PacksService,
    private readonly manifests: ManifestService,
    private readonly zip: ZipExtractorService,
    private readonly storage: StorageService,
  ) {}

  async importBundle(
    file: Express.Multer.File | undefined,
    type: PackType,
    policy: DuplicatePolicy = "replace",
  ): Promise<ImportReport> {
    if (!file) throw new BadRequestException('ZIP file is required in the "file" field');

    const startedAt = Date.now();
    const workDir = path.join(this.storage.tempDir(), `import-${randomUUID()}`);
    const extractedDir = path.join(workDir, "extracted");
    const warnings: ImportIssue[] = [];
    const errors: ImportIssue[] = [];
    const imported: PackDto[] = [];
    const skipped: string[] = [];
    const replaced: string[] = [];

    try {
      await mkdir(extractedDir, { recursive: true });
      await this.zip.extract(file.path, extractedDir);

      const manifestPaths = await this.manifests.findManifests(extractedDir);
      if (manifestPaths.length === 0) {
        throw new BadRequestException(
          "No manifest.json found inside the ZIP archive. Expected pack folders with manifest.json.",
        );
      }

      for (const manifestPath of manifestPaths) {
        const parsed = await this.manifests.parse(manifestPath, type);
        if (!parsed.type) {
          warnings.push({
            level: "warning",
            pack: parsed.name,
            message:
              "No modules[] declared in manifest.json; pack type was taken from the endpoint.",
          });
        }

        const existing = await this.packs.findOneBy({ packUuid: parsed.uuid });
        if (existing && policy === "skip") {
          skipped.push(parsed.name);
          continue;
        }

        const folderName = existing?.folderName ?? (await this.uniqueFolderName(parsed.name, type));
        const finalDir = path.join(this.storage.packsDir(type), folderName);
        const stagingDir = path.join(this.storage.packsDir(type), `.staging-${randomUUID()}`);

        try {
          await this.copyDirectory(parsed.packRoot, stagingDir);
          await mkdir(this.storage.iconsDir(), { recursive: true });
          const icon = await this.findIcon(stagingDir);
          const iconPath = icon
            ? await this.installIcon(icon, folderName)
            : (existing?.iconPath ?? null);

          await rm(finalDir, { recursive: true, force: true });
          await rename(stagingDir, finalDir);

          const sizeBytes = await dirSize(finalDir);
          const entity = existing ?? this.packs.create();
          entity.name = parsed.name;
          entity.packUuid = parsed.uuid;
          entity.version = parsed.version;
          entity.versionArray = parsed.versionArray;
          entity.type = type;
          entity.folderName = folderName;
          entity.iconPath = iconPath;
          entity.sizeBytes = String(sizeBytes);
          entity.dependencies = parsed.dependencies;
          entity.manifest = parsed.raw;
          entity.sourceBundle = file.originalname ? path.basename(file.originalname) : null;

          const saved = await this.packs.save(entity);
          const dto = this.packsService.toDto(saved);
          imported.push(dto);
          if (existing) replaced.push(parsed.name);
        } catch (error) {
          await rm(stagingDir, { recursive: true, force: true });
          errors.push({
            level: "error",
            pack: parsed.name,
            message: (error as Error).message,
          });
          this.logger.error(`Failed to import pack "${parsed.name}"`, (error as Error).stack);
        }
      }

      await this.attachDependencyStatus(imported, warnings);
      for (const issue of errors) {
        warnings.push(issue);
      }

      return {
        imported,
        skipped,
        replaced,
        warnings,
        errors,
        durationMs: Date.now() - startedAt,
        bundleType: type,
        duplicatePolicy: policy,
      };
    } finally {
      await this.zip.cleanup(workDir);
      await rm(file.path, { force: true });
    }
  }

  private async copyDirectory(source: string, destination: string): Promise<void> {
    await cp(source, destination, { recursive: true, dereference: false, errorOnExist: false });
  }

  private async uniqueFolderName(name: string, type: PackType): Promise<string> {
    const base = slugify(name);
    const existing = await this.packs.find({
      where: { type },
      select: { folderName: true, id: true },
    });
    const names = new Set(existing.map((pack) => pack.folderName));
    let candidate = base;
    let suffix = 2;
    while (names.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async findIcon(dir: string): Promise<string | null> {
    const entries = await readdir(dir, { withFileTypes: true });
    const candidates = ["pack_icon.png", "pack_icon.jpg", "pack_icon.jpeg", "pack_icon.gif"];
    for (const candidate of candidates) {
      const match = entries.find(
        (entry) => entry.isFile() && entry.name.toLowerCase() === candidate,
      );
      if (match) return path.join(dir, match.name);
    }
    return null;
  }

  private async installIcon(source: string, folderName: string): Promise<string> {
    const extension = path.extname(source).toLowerCase();
    const fileName = `${folderName}${extension}`;
    const target = path.join(this.storage.iconsDir(), fileName);
    await copyFile(source, target);
    await this.removeOtherIcons(folderName, fileName);
    return path.relative(this.storage.root, target).split(path.sep).join("/");
  }

  private async removeOtherIcons(folderName: string, keep: string): Promise<void> {
    const entries = await readdir(this.storage.iconsDir());
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith(`${folderName}.`) && entry !== keep)
        .map((entry) => rm(path.join(this.storage.iconsDir(), entry), { force: true })),
    );
  }

  private async attachDependencyStatus(packs: PackDto[], warnings: ImportIssue[]): Promise<void> {
    const uuids = [...new Set(packs.flatMap((pack) => pack.dependencies.map((dep) => dep.uuid)))];
    if (uuids.length === 0) return;

    const resolved = await this.packs.find({
      where: { packUuid: In(uuids) },
      select: { id: true, packUuid: true },
    });
    const byUuid = new Map(resolved.map((pack) => [pack.packUuid, pack.id]));

    for (const pack of packs) {
      pack.dependencies = pack.dependencies.map((dependency) => {
        const resolvedPackId = byUuid.get(dependency.uuid) ?? null;
        if (!resolvedPackId) {
          warnings.push({
            level: "warning",
            pack: pack.name,
            message: `Missing dependency ${dependency.uuid}${dependency.version ? ` @ ${dependency.version.join(".")}` : ""}`,
          });
        }
        return { ...dependency, missing: !resolvedPackId, resolvedPackId };
      });
    }
  }
}
