import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AllowListDto, AllowListEntry } from "@mc/shared";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "../../common/storage/storage.service.js";

interface RawAllowListEntry {
  name: string;
  xuid?: string;
}

@Injectable()
export class AllowlistService {
  private readonly logger = new Logger(AllowlistService.name);

  constructor(
    @Inject(StorageService) private readonly storage: StorageService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private getAllowlistPath(): string {
    const levelName = this.config.get<string>("BEDROCK_LEVEL_NAME", "active");
    return path.join(this.storage.dataRoot, "worlds", levelName, "allowlist.json");
  }

  async getAllowlist(): Promise<AllowListDto> {
    const filePath = this.getAllowlistPath();
    try {
      const content = await readFile(filePath, "utf8");
      const entries = JSON.parse(content) as RawAllowListEntry[];
      return { entries: entries.map((e) => ({ name: e.name, xuid: e.xuid })) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { entries: [] };
      }
      this.logger.error(`Failed to read allowlist: ${(error as Error).message}`);
      throw error;
    }
  }

  async addEntry(entry: AllowListEntry): Promise<AllowListDto> {
    const allowlist = await this.getAllowlist();

    // Check if entry already exists (by name or xuid)
    const exists = allowlist.entries.some(
      (e) =>
        e.name.toLowerCase() === entry.name.toLowerCase() || (entry.xuid && e.xuid === entry.xuid),
    );

    if (exists) {
      return allowlist;
    }

    allowlist.entries.push(entry);
    await this.saveAllowlist(allowlist.entries);
    return allowlist;
  }

  async removeEntry(name: string): Promise<AllowListDto> {
    const allowlist = await this.getAllowlist();
    const filtered = allowlist.entries.filter((e) => e.name.toLowerCase() !== name.toLowerCase());

    if (filtered.length === allowlist.entries.length) {
      throw new NotFoundException(`Player "${name}" not found in allowlist`);
    }

    await this.saveAllowlist(filtered);
    return { entries: filtered };
  }

  async clear(): Promise<AllowListDto> {
    await this.saveAllowlist([]);
    return { entries: [] };
  }

  private async saveAllowlist(entries: RawAllowListEntry[]): Promise<void> {
    const filePath = this.getAllowlistPath();
    await writeFile(filePath, JSON.stringify(entries, null, 2), "utf8");
    this.logger.log(`Updated allowlist at ${filePath}`);
  }
}
