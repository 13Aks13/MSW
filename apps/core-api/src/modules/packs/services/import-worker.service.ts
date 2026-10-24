import { stat } from "node:fs/promises";
import type { DuplicatePolicy } from "@mc/shared";
import { Inject, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import { Redis as IORedis } from "ioredis";
import { ImportJobService } from "./import-job.service.js";
import { PackImportService } from "./pack-import.service.js";

export class ImportWorkerService implements OnModuleInit {
  private worker?: Worker;

  constructor(
    @Inject(ConfigService) config: ConfigService,
    private readonly jobs: ImportJobService,
    private readonly importer: PackImportService,
  ) {
    if (config.get<string>("RUN_WORKER", "false").toLowerCase() !== "true") {
      return;
    }
    const redisUrl = config.get<string>("REDIS_URL", "redis://localhost:6379");
    this.worker = new Worker(
      "pack-import",
      async (job) => {
        const data = job.data as {
          jobId: string;
          filePath: string;
          type: "resource" | "behavior";
          policy: DuplicatePolicy;
        };
        const entity = await this.jobs.getJob(data.jobId);
        if (!entity) {
          throw new Error("Import job not found");
        }
        await this.jobs.markActive(data.jobId, "Starting");
        const fileStat = await stat(data.filePath);
        const file = {
          path: data.filePath,
          originalname: data.filePath.split("/").pop() ?? "bundle.zip",
          size: fileStat.size,
        } as Express.Multer.File;
        const report = await this.importer.importBundle(
          file,
          data.type,
          data.policy,
          async (progress, step, logMessage) => {
            await this.jobs.updateProgress(data.jobId, progress, step, logMessage);
          },
        );
        await this.jobs.complete(data.jobId, report);
        return report;
      },
      { connection: new IORedis(redisUrl, { maxRetriesPerRequest: null }) },
    );
    this.worker.on("failed", async (job, err) => {
      if (job?.data?.jobId) {
        await this.jobs.fail(job.data.jobId, err.message);
      }
    });
  }

  onModuleInit(): void {
    // worker starts automatically
  }
}
