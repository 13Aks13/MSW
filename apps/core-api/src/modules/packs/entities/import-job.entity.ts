import type { DuplicatePolicy, ImportJobStatus, PackType } from "@mc/shared";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "import_jobs" })
export class ImportJobEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "bundle_type", type: "varchar", length: 20 })
  bundleType!: PackType;

  @Column({ name: "duplicate_policy", type: "varchar", length: 20 })
  duplicatePolicy!: DuplicatePolicy;

  @Column({ name: "file_path", type: "text" })
  filePath!: string;

  @Column({ type: "varchar", length: 20, default: "queued" })
  status!: ImportJobStatus;

  @Column({ type: "int", default: 0 })
  progress!: number;

  @Column({ name: "current_step", type: "varchar", length: 255, default: "" })
  currentStep!: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  logs!: string[];

  @Column({ type: "jsonb", nullable: true })
  report!: Record<string, unknown> | null;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;
}
