import type { DuplicatePolicy, ImportJobDto, ImportReport, PackType } from "@mc/shared";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type Repository } from "typeorm";
import { ImportJobEntity } from "../entities/import-job.entity.js";

@Injectable()
export class ImportJobService {
  constructor(
    @InjectRepository(ImportJobEntity)
    private readonly jobs: Repository<ImportJobEntity>,
  ) {}

  async createJob(input: {
    bundleType: PackType;
    duplicatePolicy: DuplicatePolicy;
    filePath: string;
  }): Promise<ImportJobEntity> {
    const job = this.jobs.create({
      bundleType: input.bundleType,
      duplicatePolicy: input.duplicatePolicy,
      filePath: input.filePath,
      status: "queued",
      progress: 0,
      currentStep: "Queued",
      logs: [],
      report: null,
      error: null,
      completedAt: null,
    });
    return this.jobs.save(job);
  }

  async getJob(id: string): Promise<ImportJobEntity | null> {
    return this.jobs.findOne({ where: { id } });
  }

  async markActive(id: string, step: string): Promise<void> {
    await this.jobs.update(id, { status: "active", currentStep: step, progress: 1 });
  }

  async updateProgress(id: string, progress: number, step: string, log?: string): Promise<void> {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) {
      return;
    }
    const logs = log ? [...job.logs, log].slice(-200) : job.logs;
    await this.jobs.update(id, { progress, currentStep: step, logs });
  }

  async complete(id: string, report: ImportReport): Promise<void> {
    await this.jobs.update(id, {
      status: "completed",
      progress: 100,
      currentStep: "Completed",
      report: report as never,
      completedAt: new Date(),
    });
  }

  async fail(id: string, error: string): Promise<void> {
    await this.jobs.update(id, {
      status: "failed",
      currentStep: "Failed",
      error,
      completedAt: new Date(),
    });
  }

  toDto(job: ImportJobEntity): ImportJobDto {
    return {
      id: job.id,
      bundleType: job.bundleType,
      duplicatePolicy: job.duplicatePolicy,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      logs: job.logs ?? [],
      report: (job.report as ImportReport | null) ?? null,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    };
  }
}
