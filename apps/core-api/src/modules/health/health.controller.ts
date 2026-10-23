import type { HealthDto } from "@mc/shared";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { DataSource } from "typeorm";
import { Public } from "../../common/decorators/public.decorator.js";
import type { StorageService } from "../../common/storage/storage.service.js";
import type { DockerService } from "../server/docker.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly docker: DockerService,
    private readonly storage: StorageService,
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
      status: checks.every((check) => check.status === "up") ? "ok" : "degraded",
      checks,
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
