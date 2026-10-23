import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  type PackDependency,
  type PackDto,
  type PackType,
  type Paginated,
} from '@mc/shared';
import { PackEntity } from './entities/pack.entity.js';
import { WorldPackEntity } from '../worlds/entities/world-pack.entity.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { ListPacksQueryDto } from './dto/list-packs.dto.js';

@Injectable()
export class PacksService {
  constructor(
    @InjectRepository(PackEntity)
    private readonly packs: Repository<PackEntity>,
    @InjectRepository(WorldPackEntity)
    private readonly worldPacks: Repository<WorldPackEntity>,
    private readonly storage: StorageService,
  ) {}

  async list(query: ListPacksQueryDto): Promise<Paginated<PackDto>> {
    const builder = this.packs.createQueryBuilder('pack');
    if (query.type) builder.andWhere('pack.type = :type', { type: query.type });
    if (query.search) {
      builder.andWhere('(lower(pack.name) LIKE :search OR pack.packUuid::text LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    builder
      .orderBy('pack.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await builder.getManyAndCount();
    return {
      items: items.map((pack) => this.toDto(pack)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async get(id: string): Promise<PackEntity> {
    const pack = await this.packs.findOneBy({ id });
    if (!pack) throw new NotFoundException(`Pack ${id} not found`);
    return pack;
  }

  async findDependencies(
    id: string,
  ): Promise<Array<PackDependency & { resolvedPackId: string | null; missing: boolean }>> {
    const pack = await this.get(id);
    const uuids = pack.dependencies.map((dependency) => dependency.uuid);
    if (uuids.length === 0) return [];

    const resolved = await this.packs.find({
      where: { packUuid: In(uuids) },
      select: { id: true, packUuid: true, name: true },
    });
    const byUuid = new Map(resolved.map((item) => [item.packUuid, item.id]));

    return pack.dependencies.map((dependency) => ({
      ...dependency,
      missing: !byUuid.has(dependency.uuid),
      resolvedPackId: byUuid.get(dependency.uuid) ?? null,
    }));
  }

  async remove(id: string): Promise<void> {
    const pack = await this.get(id);
    const usages = await this.worldPacks.count({ where: { packId: id } });
    if (usages > 0) {
      throw new ConflictException(
        `Pack "${pack.name}" is used by ${usages} world configuration(s); detach it first`,
      );
    }

    await this.packs.delete({ id });
    await rm(path.join(this.storage.packsDir(pack.type), pack.folderName), {
      recursive: true,
      force: true,
    });
    if (pack.iconPath) {
      await rm(path.join(this.storage.root, pack.iconPath), { force: true });
    }
  }

  toDto(pack: PackEntity): PackDto {
    return {
      id: pack.id,
      name: pack.name,
      packUuid: pack.packUuid,
      version: pack.version,
      versionArray: pack.versionArray,
      type: pack.type,
      folderName: pack.folderName,
      iconPath: pack.iconPath,
      sizeBytes: String(pack.sizeBytes),
      dependencies: pack.dependencies ?? [],
      sourceBundle: pack.sourceBundle,
      createdAt: pack.createdAt.toISOString(),
      updatedAt: pack.updatedAt.toISOString(),
    };
  }

  countByType(): Promise<Record<PackType, number>> {
    return this.packs
      .createQueryBuilder('pack')
      .select('pack.type', 'type')
      .addSelect('count(*)', 'count')
      .groupBy('pack.type')
      .getRawMany<{ type: PackType; count: string }>()
      .then((rows) => ({
        resource: Number(rows.find((row) => row.type === 'resource')?.count ?? 0),
        behavior: Number(rows.find((row) => row.type === 'behavior')?.count ?? 0),
      }));
  }
}
