import type { BackupStatus } from "@mc/shared";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { WorldEntity } from "../../worlds/entities/world.entity.js";

@Entity({ name: "backups" })
export class BackupEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "world_id", type: "uuid", nullable: true })
  worldId!: string | null;

  @ManyToOne(() => WorldEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "world_id" })
  world!: WorldEntity | null;

  @Column({ name: "world_name", type: "varchar", length: 255 })
  worldName!: string;

  @Column({ name: "file_name", type: "varchar", length: 255, unique: true })
  fileName!: string;

  @Column({ name: "size_bytes", type: "bigint", default: 0 })
  sizeBytes!: string;

  @Column({ type: "varchar", length: 20, default: "creating" })
  status!: BackupStatus;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
