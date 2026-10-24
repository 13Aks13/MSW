import { mkdir, statfs } from "node:fs/promises";
import path from "node:path";
import { STORAGE_DIRS } from "@mc/shared";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  readonly root: string;
  readonly dataRoot: string;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.root = path.resolve(config.get<string>("STORAGE_ROOT", "./storage"));
    this.dataRoot = path.resolve(config.get<string>("DATA_ROOT", "./data"));
  }

  async onModuleInit(): Promise<void> {
    await Promise.all(
      Object.values(STORAGE_DIRS).map((dir) =>
        mkdir(path.join(this.root, dir), { recursive: true }),
      ),
    );
    await mkdir(path.join(this.root, STORAGE_DIRS.metadata, "icons"), { recursive: true });
    await mkdir(path.join(this.root, STORAGE_DIRS.temp, "uploads"), { recursive: true });
    this.logger.log(`Storage ready at ${this.root} (data root: ${this.dataRoot})`);
  }

  packsDir(type: "resource" | "behavior"): string {
    return path.join(
      this.root,
      type === "resource" ? STORAGE_DIRS.resourcePacks : STORAGE_DIRS.behaviorPacks,
    );
  }

  worldsDir(): string {
    return path.join(this.root, STORAGE_DIRS.worlds);
  }

  backupsDir(): string {
    return path.join(this.root, STORAGE_DIRS.backups);
  }

  tempDir(): string {
    return path.join(this.root, STORAGE_DIRS.temp);
  }

  uploadsDir(): string {
    return path.join(this.root, STORAGE_DIRS.temp, "uploads");
  }

  iconsDir(): string {
    return path.join(this.root, STORAGE_DIRS.metadata, "icons");
  }

  activeWorldDir(): string {
    const levelName = this.config.get<string>("BEDROCK_LEVEL_NAME", "active");
    return path.join(this.dataRoot, "worlds", levelName);
  }

  serverPropertiesPath(): string {
    return path.join(this.dataRoot, "server.properties");
  }

  /** Join a user-controlled relative path and refuse to escape the base. */
  safeJoin(base: string, relative: string): string {
    const resolvedBase = path.resolve(base);
    const resolved = path.resolve(resolvedBase, relative);
    if (resolved !== resolvedBase && !resolved.startsWith(`${resolvedBase}${path.sep}`)) {
      throw new Error(`Path escapes storage root: ${relative}`);
    }
    return resolved;
  }

  async diskUsage(): Promise<{ usedBytes: string; freeBytes: string }> {
    try {
      const stats = await statfs(this.root);
      const usedBytes = (stats.blocks - stats.bfree) * stats.bsize;
      const freeBytes = stats.bavail * stats.bsize;
      return { usedBytes: String(usedBytes), freeBytes: String(freeBytes) };
    } catch {
      return { usedBytes: "0", freeBytes: "0" };
    }
  }
}
