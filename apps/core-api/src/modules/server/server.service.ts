import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  DashboardDto,
  LogLineDto,
  PackType,
  ServerStatsDto,
  ServerStatusDto,
} from '@mc/shared';
import { DockerService } from './docker.service.js';
import { StorageService } from '../../common/storage/storage.service.js';

@Injectable()
export class ServerService {
  private readonly logger = new Logger(ServerService.name);

  constructor(
    private readonly docker: DockerService,
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
  ) {}

  status(): Promise<ServerStatusDto> {
    return this.docker.status();
  }

  stats(): Promise<ServerStatsDto> {
    return this.docker.stats();
  }

  start(): Promise<void> {
    return this.docker.start();
  }

  stop(): Promise<void> {
    return this.docker.stop();
  }

  restart(): Promise<void> {
    return this.docker.restart();
  }

  sendCommand(command: string): Promise<string> {
    return this.docker.sendCommand(command);
  }

  streamLogs(sink: (line: LogLineDto) => void, tail = 200): Promise<() => void> {
    return this.docker.streamLogs(tail, sink);
  }

  logsText(tail = 500): Promise<string> {
    return this.docker.logsText(tail);
  }

  async dashboard(): Promise<DashboardDto> {
    const [server, stats, packRows, worldRows, backupRows, storageUsage] = await Promise.all([
      this.status().catch(() => null),
      this.stats().catch(() => null),
      this.dataSource
        .query(`SELECT type, count(*)::int AS count FROM packs GROUP BY type`)
        .catch(() => [] as Array<{ type: PackType; count: number }>),
      this.dataSource.query(`SELECT count(*)::int AS count FROM worlds`).catch(() => [{ count: 0 }]),
      this.dataSource.query(`SELECT count(*)::int AS count FROM backups`).catch(() => [{ count: 0 }]),
      this.storage.diskUsage(),
    ]);

    const packs: Record<PackType, number> = { resource: 0, behavior: 0 };
    for (const row of packRows as Array<{ type: PackType; count: number }>) {
      packs[row.type] = row.count;
    }

    return {
      server:
        server ??
        {
          containerName: 'mc-bedrock',
          exists: false,
          state: 'unknown',
          image: null,
          startedAt: null,
          uptimeSeconds: 0,
          health: null,
          playersOnline: null,
        },
      stats,
      packs,
      worlds: Number((worldRows as Array<{ count: number }>)[0]?.count ?? 0),
      backups: Number((backupRows as Array<{ count: number }>)[0]?.count ?? 0),
      storageUsedBytes: storageUsage.usedBytes,
      storageFreeBytes: storageUsage.freeBytes,
    };
  }
}
