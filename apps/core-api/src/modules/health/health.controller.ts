import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { HealthDto } from "@mc/shared";
import { Controller, Get, Inject, Logger } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { Public } from "../../common/decorators/public.decorator.js";
import { StorageService } from "../../common/storage/storage.service.js";
import { DockerService } from "../server/docker.service.js";

const logger = new Logger("AppVersion");

function resolveAppVersion(): string {
  const envVersion = process.env.APP_VERSION?.trim();
  if (envVersion) {
    return envVersion;
  }

  const packageJsonPath = fileURLToPath(new URL("../../../package.json", import.meta.url));

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version?: string;
    };
    if (packageJson.version) {
      return packageJson.version;
    }

    logger.warn(`No version field in ${packageJsonPath}`);
  } catch (error) {
    logger.warn(`Could not read ${packageJsonPath}: ${(error as Error).message}`);
  }

  return "unknown";
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  private readonly appVersion = resolveAppVersion();

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(DockerService) private readonly docker: DockerService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<HealthDto> {
    const checks: HealthDto["checks"] = [];

    const dbStart = Date.now();
    try {
      await this.dataSource.query("SELECT 1");
      checks.push({ name: "postgres", status: "up", latencyMs: Date.now() - dbStart });
    } catch (error) {
      checks.push({ name: "postgres", status: "down", message: (error as Error).message });
    }

    const dockerStart = Date.now();
    try {
      await this.docker.ping();
      checks.push({ name: "docker", status: "up", latencyMs: Date.now() - dockerStart });
    } catch (error) {
      checks.push({
        name: "docker",
        status: "down",
        message: (error as Error).message,
      });
    }

    try {
      const usage = await this.storage.diskUsage();
      checks.push({
        name: "storage",
        status: Number(usage.freeBytes) > 0 ? "up" : "down",
        message: `free ${usage.freeBytes} bytes`,
      });
    } catch (error) {
      checks.push({ name: "storage", status: "down", message: (error as Error).message });
    }

    return {
      status: checks.every((check: HealthDto["checks"][number]) => check.status === "up")
        ? "ok"
        : "degraded",
      checks,
      version: this.appVersion,
      timestamp: new Date().toISOString(),
    };
  }
}
