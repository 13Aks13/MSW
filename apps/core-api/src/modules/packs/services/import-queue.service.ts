import type { DuplicatePolicy } from "@mc/shared";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { Redis as IORedis } from "ioredis";

@Injectable()
export class ImportQueueService {
  private readonly logger = new Logger(ImportQueueService.name);
  readonly queue: Queue;

  constructor(config: ConfigService) {
    const connection = new IORedis(config.get<string>("REDIS_URL", "redis://localhost:6379"), {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue("pack-import", { connection });
  }

  async enqueue(data: {
    jobId: string;
    filePath: string;
    type: "resource" | "behavior";
    policy: DuplicatePolicy;
  }): Promise<void> {
    await this.queue.add("import", data, { attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
    this.logger.log(`Enqueued import job ${data.jobId}`);
  }
}
