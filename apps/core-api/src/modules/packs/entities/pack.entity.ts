import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PackDependency, PackType } from '@mc/shared';

@Entity({ name: 'packs' })
@Index('idx_packs_type', ['type'])
export class PackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'pack_uuid', type: 'uuid', unique: true })
  packUuid!: string;

  @Column({ type: 'varchar', length: 50 })
  version!: string;

  @Column({ name: 'version_array', type: 'jsonb' })
  versionArray!: number[];

  @Column({ type: 'varchar', length: 20 })
  type!: PackType;

  @Column({ name: 'folder_name', type: 'varchar', length: 255 })
  folderName!: string;

  @Column({ name: 'icon_path', type: 'text', nullable: true })
  iconPath!: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', default: 0 })
  sizeBytes!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  dependencies!: PackDependency[];

  @Column({ type: 'jsonb' })
  manifest!: Record<string, unknown>;

  @Column({ name: 'source_bundle', type: 'varchar', length: 255, nullable: true })
  sourceBundle!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
