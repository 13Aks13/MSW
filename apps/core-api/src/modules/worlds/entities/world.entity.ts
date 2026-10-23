import type { WorldStatus } from "@mc/shared";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { WorldPackEntity } from "./world-pack.entity.js";

@Entity({ name: "worlds" })
export class WorldEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  seed!: string | null;

  @Column({ type: "varchar", length: 50, default: "survival" })
  gamemode!: string;

  @Column({ type: "varchar", length: 50, default: "normal" })
  difficulty!: string;

  @Column({ type: "varchar", length: 20, default: "ready" })
  status!: WorldStatus;

  @Column({ name: "folder_name", type: "varchar", length: 255, unique: true })
  folderName!: string;

  @Column({ name: "size_bytes", type: "bigint", default: 0 })
  sizeBytes!: string;

  // String relation targets avoid an ESM circular import between the two
  // entity modules (world.entity <-> world-pack.entity).
  @OneToMany("WorldPackEntity", "world", { cascade: true })
  packs!: Relation<WorldPackEntity>[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
