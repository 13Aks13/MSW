import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { PackType } from '@mc/shared';
import { PackEntity } from '../../packs/entities/pack.entity.js';
import type { WorldEntity } from './world.entity.js';

@Entity({ name: 'world_packs' })
export class WorldPackEntity {
  @PrimaryColumn({ name: 'world_id', type: 'uuid' })
  worldId!: string;

  @PrimaryColumn({ name: 'pack_id', type: 'uuid' })
  packId!: string;

  @Column({ type: 'varchar', length: 20 })
  kind!: PackType;

  // Structural type instead of `Relation<WorldEntity>`: TypeORM's
  // `Relation<T>` is an alias for `T`, so TypeScript emits `WorldEntity`
  // into the decorator metadata and reintroduces the ESM cycle at runtime.
  @ManyToOne('WorldEntity', 'packs', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'world_id' })
  world!: Pick<WorldEntity, 'id'>;

  @ManyToOne(() => PackEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pack_id' })
  pack!: Relation<PackEntity>;
}
